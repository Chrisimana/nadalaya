/*
 * Alur analisis akurasi nada di browser (UC-12):
 * memuat model → mono 16 kHz → CREPE → DTW → skor.
 */
import type { HasilAnalisis, NadaAcuan, TitikPitch } from "@/lib/types";
import { deteksiPitch, keMono16k, muatModelCrepe, NadaTidakTerdeteksiError } from "./crepe";
import { selaraskan } from "./dtw";
import { daftarMeleset, deviasiPerNada, konturSelaras, skorAkhir } from "./skor";

export type TahapAnalisis = "memuat_model" | "menganalisis";

/** Minimal 20% bingkai rekaman harus bersuara (FR-09, NFR-09). */
export const MIN_RASIO_BERSUARA = 0.2;

/**
 * Bagian murni analisis: dari kontur CREPE dan nada acuan menjadi skor,
 * grafik, dan nada meleset. Melempar NadaTidakTerdeteksiError bila bingkai
 * bersuara terlalu sedikit.
 */
export function analisisKontur(kontur: TitikPitch[], acuan: NadaAcuan[]): HasilAnalisis {
  const bersuara = kontur.filter((t) => t.midi !== null).length;
  if (kontur.length === 0 || bersuara / kontur.length < MIN_RASIO_BERSUARA) {
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
