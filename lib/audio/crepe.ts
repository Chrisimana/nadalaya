/*
 * Deteksi pitch dengan CREPE (TensorFlow.js) di browser pengguna (FR-12).
 * Mesin CREPE dikerjakan pada langkah berikutnya; berkas ini menyiapkan
 * antarmuka dan jenis galat yang sudah dipakai oleh UI.
 */
import type { TitikPitch } from "@/lib/types";

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

export interface ModelCrepe {
  /** Kontur pitch per bingkai; bingkai dengan confidence rendah bernilai null. */
  deteksiPitch(rekaman: Blob): Promise<TitikPitch[]>;
}

/** Memuat model CREPE (varian tiny/small) dan menyimpannya di cache browser. */
export async function muatModelCrepe(): Promise<ModelCrepe> {
  // TODO: langkah berikutnya — muat @tensorflow/tfjs dan bobot CREPE tiny,
  // resample rekaman ke 16 kHz mono, lalu jalankan inferensi per bingkai 10 ms.
  throw new ModelGagalDimuatError("Modul CREPE belum dipasang.");
}
