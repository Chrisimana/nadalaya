/*
 * Deteksi pitch dengan CREPE (TensorFlow.js) di browser pengguna (FR-12).
 * Rekaman tidak pernah dikirim ke server (NFR-07).
 *
 * Model: CREPE tiny dari ml5-data-and-models (MIT), disimpan lokal di
 * public/models/crepe/ agar tidak bergantung pada CDN.
 */
import type { LayersModel } from "@tensorflow/tfjs";
import type { TitikPitch } from "@/lib/types";
import { hzKeMidi } from "./nada";

export const LAJU_SAMPEL = 16000;
export const PANJANG_BINGKAI = 1024;
/** Hop 10 ms pada 16 kHz. */
export const HOP_BAWAAN = 160;
export const AMBANG_CONFIDENCE = 0.5;
const JUMLAH_BIN = 360;
const URL_MODEL = "/models/crepe/model.json";

export class ModelGagalDimuatError extends Error {
  constructor(pesan = "Model analisis gagal dimuat.") {
    super(pesan);
    this.name = "ModelGagalDimuatError";
  }
}

export class NadaTidakTerdeteksiError extends Error {
  constructor() {
    super("Suara tidak terdeteksi, silakan rekam ulang.");
    this.name = "NadaTidakTerdeteksiError";
  }
}

/** Antarmuka minimal model: masukan [n, 1024] → keluaran [n, 360]. */
export interface ModelCrepe {
  prediksi(bingkai: Float32Array, jumlah: number): Promise<Float32Array>;
}

/* ---------- Fungsi murni ---------- */

/**
 * Memotong audio mono 16 kHz menjadi bingkai 1024 sampel (berpusat pada
 * kelipatan hop, seperti CREPE asli) dan menormalisasi tiap bingkai:
 * dikurangi rata-rata lalu dibagi simpangan baku.
 */
export function buatBingkai(audio: Float32Array, hop = HOP_BAWAAN) {
  const jumlah = Math.max(1, 1 + Math.floor(audio.length / hop));
  const hasil = new Float32Array(jumlah * PANJANG_BINGKAI);
  const setengah = PANJANG_BINGKAI / 2;

  for (let f = 0; f < jumlah; f++) {
    const awal = f * hop - setengah;
    const o = f * PANJANG_BINGKAI;
    let jml = 0;
    for (let k = 0; k < PANJANG_BINGKAI; k++) {
      const i = awal + k;
      const v = i >= 0 && i < audio.length ? audio[i] : 0;
      hasil[o + k] = v;
      jml += v;
    }
    const rata = jml / PANJANG_BINGKAI;
    let varians = 0;
    for (let k = 0; k < PANJANG_BINGKAI; k++) {
      const d = hasil[o + k] - rata;
      varians += d * d;
    }
    const sb = Math.max(Math.sqrt(varians / PANJANG_BINGKAI), 1e-8);
    for (let k = 0; k < PANJANG_BINGKAI; k++) hasil[o + k] = (hasil[o + k] - rata) / sb;
  }
  return { bingkai: hasil, jumlah };
}

/** cents bin ke-i menurut CREPE: 1997,38 + 20·i. */
function centBin(i: number) {
  return 1997.3794084376191 + 20 * i;
}

/**
 * Mengubah 360 aktivasi menjadi frekuensi: rata-rata berbobot cents di
 * sekitar argmax (±4 bin), confidence = aktivasi maksimum.
 */
export function dekodeAktivasi(aktivasi: Float32Array, offset = 0) {
  let maks = 0;
  let iMaks = 0;
  for (let i = 0; i < JUMLAH_BIN; i++) {
    const v = aktivasi[offset + i];
    if (v > maks) {
      maks = v;
      iMaks = i;
    }
  }
  let jumlahBobot = 0;
  let jumlahCent = 0;
  for (let i = Math.max(0, iMaks - 4); i <= Math.min(JUMLAH_BIN - 1, iMaks + 4); i++) {
    const v = aktivasi[offset + i];
    jumlahBobot += v;
    jumlahCent += v * centBin(i);
  }
  const cents = jumlahBobot > 0 ? jumlahCent / jumlahBobot : centBin(iMaks);
  return { frekuensi: 10 * 2 ** (cents / 1200), confidence: maks };
}

/**
 * Menjalankan CREPE per batch agar UI tidak macet. Bingkai dengan
 * confidence < 0,5 dianggap tanpa suara (midi null).
 */
export async function deteksiPitch(
  audio: Float32Array,
  model: ModelCrepe,
  opsi: { hop?: number; ukuranBatch?: number; onProgres?: (rasio: number) => void } = {},
): Promise<TitikPitch[]> {
  const { hop = HOP_BAWAAN, ukuranBatch = 256, onProgres } = opsi;
  const { bingkai, jumlah } = buatBingkai(audio, hop);
  const titik: TitikPitch[] = [];

  for (let mulai = 0; mulai < jumlah; mulai += ukuranBatch) {
    const n = Math.min(ukuranBatch, jumlah - mulai);
    const potongan = bingkai.subarray(mulai * PANJANG_BINGKAI, (mulai + n) * PANJANG_BINGKAI);
    const aktivasi = await model.prediksi(potongan, n);
    for (let j = 0; j < n; j++) {
      const { frekuensi, confidence } = dekodeAktivasi(aktivasi, j * JUMLAH_BIN);
      titik.push({
        waktu: ((mulai + j) * hop) / LAJU_SAMPEL,
        midi: confidence >= AMBANG_CONFIDENCE ? hzKeMidi(frekuensi) : null,
      });
    }
    onProgres?.((mulai + n) / jumlah);
    // Beri kesempatan browser menggambar ulang di antara batch.
    await new Promise((r) => setTimeout(r, 0));
  }
  return titik;
}

/* ---------- Model ---------- */

/** Membungkus LayersModel TensorFlow.js menjadi ModelCrepe. */
export function bungkusModel(tf: typeof import("@tensorflow/tfjs"), model: LayersModel): ModelCrepe {
  return {
    async prediksi(bingkai, jumlah) {
      const masukan = tf.tensor2d(bingkai, [jumlah, PANJANG_BINGKAI]);
      const keluaran = model.predict(masukan) as import("@tensorflow/tfjs").Tensor;
      try {
        return (await keluaran.data()) as Float32Array;
      } finally {
        masukan.dispose();
        keluaran.dispose();
      }
    },
  };
}

let modelDimuat: Promise<ModelCrepe> | null = null;

/**
 * Memuat model CREPE sekali lalu menyimpannya di memori. Berkas model
 * disimpan cache browser sehingga pemuatan berikutnya lebih cepat.
 */
export function muatModelCrepe(): Promise<ModelCrepe> {
  modelDimuat ??= (async () => {
    try {
      const tf = await import("@tensorflow/tfjs");
      try {
        await tf.setBackend("webgl");
      } catch {
        await tf.setBackend("cpu");
      }
      await tf.ready();
      const model = await tf.loadLayersModel(URL_MODEL);
      // Pemanasan agar shader WebGL terkompilasi sebelum analisis sebenarnya.
      const bungkus = bungkusModel(tf, model);
      await bungkus.prediksi(new Float32Array(PANJANG_BINGKAI), 1);
      return bungkus;
    } catch (err) {
      console.error("[crepe] model gagal dimuat", err);
      modelDimuat = null;
      throw new ModelGagalDimuatError();
    }
  })();
  return modelDimuat;
}

/* ---------- Pra-proses di browser ---------- */

/** Mengubah rekaman menjadi audio mono 16 kHz dengan OfflineAudioContext. */
export async function keMono16k(rekaman: Blob): Promise<Float32Array> {
  const data = await rekaman.arrayBuffer();
  const dekoder = new OfflineAudioContext(1, 1, LAJU_SAMPEL);
  const asli = await dekoder.decodeAudioData(data);

  const panjang = Math.max(1, Math.ceil(asli.duration * LAJU_SAMPEL));
  const konteks = new OfflineAudioContext(1, panjang, LAJU_SAMPEL);
  const sumber = konteks.createBufferSource();
  sumber.buffer = asli;
  sumber.connect(konteks.destination);
  sumber.start();
  const hasil = await konteks.startRendering();
  return hasil.getChannelData(0);
}
