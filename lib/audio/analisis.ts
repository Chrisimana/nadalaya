/*
 * Alur analisis akurasi nada di browser (UC-12):
 * memuat model → mono 16 kHz → CREPE → DTW → skor.
 */
import type { HasilAnalisis, NadaAcuan, TitikPitch } from "@/lib/types";
import { deteksiPitch, keMono16k, muatModelCrepe, NadaTidakTerdeteksiError } from "./crepe";
import { selaraskan } from "./dtw";
import { potongHening } from "./kontur";
import { daftarMeleset, deviasiPerNada, konturSelaras, skorAkhir } from "./skor";

export type TahapAnalisis = "memuat_model" | "menganalisis";

/** Minimal 20% bingkai (setelah hening awal/akhir dipotong) harus bersuara (FR-09, NFR-09). */
export const MIN_RASIO_BERSUARA = 0.2;
/** Total bingkai bersuara minimal 30% dari durasi acuan. */
const MIN_PORSI_DURASI_ACUAN = 0.3;

/** Durasi acuan dari awal nada pertama hingga akhir nada terakhir (detik). */
export function durasiAcuan(acuan: NadaAcuan[]) {
  if (acuan.length === 0) return 0;
  return Math.max(...acuan.map((n) => n.waktu + n.durasi)) - Math.min(...acuan.map((n) => n.waktu));
}

/**
 * Bagian murni analisis: dari kontur CREPE dan nada acuan menjadi skor,
 * grafik, dan nada meleset. Melempar NadaTidakTerdeteksiError bila bingkai
 * bersuara terlalu sedikit.
 */
export function analisisKontur(kontur: TitikPitch[], acuan: NadaAcuan[]): HasilAnalisis {
  // Rasio dihitung setelah hening di awal dan akhir dipotong, agar rekaman
  // panjang dengan jeda sebelum/sesudah bernyanyi tidak ditolak.
  const inti = potongHening(kontur);
  const bersuara = inti.filter((t) => t.midi !== null).length;
  const jarak = kontur.length > 1 ? kontur[1].waktu - kontur[0].waktu : 0.01;
  if (
    inti.length === 0 ||
    bersuara / inti.length < MIN_RASIO_BERSUARA ||
    bersuara * jarak < MIN_PORSI_DURASI_ACUAN * durasiAcuan(acuan)
  ) {
    throw new NadaTidakTerdeteksiError();
  }

  const selaras = selaraskan(kontur, acuan);
  if (selaras.nyanyian.length === 0) throw new NadaTidakTerdeteksiError();

  const deviasi = deviasiPerNada(acuan, selaras);
  return {
    skor: skorAkhir(deviasi),
    kontur: konturSelaras(selaras),
    acuan,
    nadaMeleset: daftarMeleset(acuan, deviasi),
  };
}

export async function jalankanAnalisis({
  rekaman,
  acuan,
  onTahap,
  onProgres,
}: {
  rekaman: Blob;
  acuan: NadaAcuan[];
  onTahap: (tahap: TahapAnalisis) => void;
  onProgres?: (rasio: number) => void;
}): Promise<HasilAnalisis> {
  const t0 = performance.now();
  onTahap("memuat_model");
  const model = await muatModelCrepe();
  const t1 = performance.now();

  onTahap("menganalisis");
  const audio = await keMono16k(rekaman);
  const kontur = await deteksiPitch(audio, model, { onProgres });
  const t2 = performance.now();
  const hasil = analisisKontur(kontur, acuan);
  const t3 = performance.now();

  // Pemantauan NFR-01: rekaman 30 detik selesai dianalisis ≤ 15 detik.
  console.info(
    `[analisis] rekaman ${(audio.length / 16000).toFixed(1)} dtk · model ${((t1 - t0) / 1000).toFixed(1)} dtk · ` +
      `CREPE ${((t2 - t1) / 1000).toFixed(1)} dtk · DTW+skor ${((t3 - t2) / 1000).toFixed(2)} dtk · ` +
      `total ${((t3 - t0) / 1000).toFixed(1)} dtk`,
  );
  return hasil;
}
