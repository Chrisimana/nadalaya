import type { HasilCekAkses } from "@/lib/types";
import { BelumTersambungError } from "./galat";

/**
 * UC-09 Memeriksa Hak Akses dan Kuota (FR-08, FR-09).
 * Dipanggil saat pengguna memilih materi. Pemeriksaan dilakukan di server.
 */
export async function cekAksesDanKuota(materiId: string): Promise<HasilCekAkses> {
  void materiId;
  // TODO: sambungkan ke Supabase (API route: getStatusEfektif + hitung sesi_analisis selesai hari ini, WIB)
  throw new BelumTersambungError();
}

/**
 * Dipanggil setiap kali tombol Analisis ditekan: server memeriksa ulang kuota,
 * lalu mencatat sesi_analisis berstatus "dimulai" dan mengembalikan ID sesi.
 */
export async function mulaiSesiAnalisis(
  materiId: string,
): Promise<{ sesiId: string } | Extract<HasilCekAkses, { diizinkan: false }>> {
  void materiId;
  // TODO: sambungkan ke Supabase (API route POST /api/sesi-analisis)
  throw new BelumTersambungError();
}

/** Menandai sesi batal (rekaman terlalu pendek, tanpa suara, model gagal dimuat). */
export async function batalkanSesiAnalisis(sesiId: string): Promise<void> {
  void sesiId;
  // TODO: sambungkan ke Supabase (API route PATCH /api/sesi-analisis/[id])
  throw new BelumTersambungError();
}
