import "server-only";

import type { ItemRiwayat, JenisMateri } from "@/lib/types";

/** Kolom riwayat_latihan beserta judul dan jenis materinya. */
export const KOLOM_RIWAYAT = "id, materi_id, skor, created_at, materi_latihan(judul, jenis)";

export type BarisRiwayat = {
  id: string;
  materi_id: string;
  skor: number;
  created_at: string;
  materi_latihan: { judul: string; jenis: JenisMateri } | null;
};

export function keItemRiwayat(baris: BarisRiwayat): ItemRiwayat {
  return {
    id: baris.id,
    materiId: baris.materi_id,
    judulMateri: baris.materi_latihan?.judul ?? "Materi dihapus",
    jenis: baris.materi_latihan?.jenis ?? "melodi",
    skor: baris.skor,
    tanggal: baris.created_at,
  };
}
