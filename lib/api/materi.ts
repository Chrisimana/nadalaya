import type { Materi, MateriLengkap } from "@/lib/types";

/** UC-06 Melihat Daftar Materi (FR-07). */
export async function getMateriList(): Promise<Materi[]> {
  // TODO: sambungkan ke Supabase (tabel materi_latihan, hanya is_aktif = true)
  return [];
}

/**
 * Mengambil satu materi beserta deret nada acuan dari berkas MIDI.
 * Mengembalikan null bila materi tidak ditemukan.
 */
export async function getMateriById(id: string): Promise<MateriLengkap | null> {
  void id;
  // TODO: sambungkan ke Supabase (materi_latihan + unduh midi_path dari Storage,
  // lalu baca dengan @tonejs/midi)
  return null;
}
