import type { HasilAnalisis, NadaAcuan, TitikPitch } from "@/lib/types";
import { deteksiPitch, keMono16k, muatModelCrepe, NadaTidakTerdeteksiError } from "./crepe";
import { selaraskan } from "./dtw";
import { potongHening } from "./kontur";
import { daftarMeleset, deviasiPerNada, konturSelaras, skorAkhir } from "./skor";

export type TahapAnalisis = "memuat_model" | "menganalisis";

export const MIN_RASIO_BERSUARA = 0.2;
export const BATAS_WAKTU_ANALISIS_DETIK = 15;
const MIN_PORSI_DURASI_ACUAN = 0.3;

export function durasiAcuan(acuan: NadaAcuan[]) {
  if (acuan.length === 0) return 0;
  return Math.max(...acuan.map((n) => n.waktu + n.durasi)) - Math.min(...acuan.map((n) => n.waktu));
}

export function analisisKontur(kontur: TitikPitch[], acuan: NadaAcuan[]): HasilAnalisis {
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
  if (selaras.nyanyian.every((b) => b.midi === null)) throw new NadaTidakTerdeteksiError();

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

  // Pencatatan waktu untuk uji NFR-01, hanya di mode pengembangan.
  if (process.env.NODE_ENV !== "production") {
    const total = (t3 - t0) / 1000;
    console.info(
      `[analisis] rekaman ${(audio.length / 16000).toFixed(1)} dtk · model ${((t1 - t0) / 1000).toFixed(1)} dtk · ` +
        `CREPE ${((t2 - t1) / 1000).toFixed(1)} dtk · DTW+skor ${((t3 - t2) / 1000).toFixed(2)} dtk · ` +
        `total ${total.toFixed(1)} dtk (${total <= BATAS_WAKTU_ANALISIS_DETIK ? "memenuhi" : "MELEBIHI"} batas ${BATAS_WAKTU_ANALISIS_DETIK} dtk)`,
    );
  }
  return hasil;
}
