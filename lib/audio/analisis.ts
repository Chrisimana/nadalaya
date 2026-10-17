/*
 * Alur analisis akurasi nada di browser (UC-12):
 * memuat model → deteksi pitch CREPE → konversi cent → DTW → skor.
 */
import type { HasilAnalisis, NadaAcuan } from "@/lib/types";
import { muatModelCrepe, NadaTidakTerdeteksiError } from "./crepe";

export type TahapAnalisis = "memuat_model" | "menganalisis";

export async function jalankanAnalisis({
  rekaman,
  acuan,
  onTahap,
}: {
  rekaman: Blob;
  acuan: NadaAcuan[];
  onTahap: (tahap: TahapAnalisis) => void;
}): Promise<HasilAnalisis> {
  onTahap("memuat_model");
  const model = await muatModelCrepe();

  onTahap("menganalisis");
  const kontur = await model.deteksiPitch(rekaman);
  if (!kontur.some((t) => t.midi !== null)) {
    throw new NadaTidakTerdeteksiError();
  }

  void acuan;
  // TODO: langkah berikutnya — selaraskan kontur dengan acuan memakai DTW
  // (lib/audio/dtw.ts), hitung skor 0–100, dan tandai nada meleset > 50 cent.
  throw new Error("Penyelarasan DTW belum tersedia.");
}
