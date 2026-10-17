import type {
  DetailRiwayat,
  ItemRiwayat,
  RingkasanDashboard,
  TitikProgres,
} from "@/lib/types";
import { BelumTersambungError } from "./galat";

export type DataRiwayat = {
  sesiId: string;
  materiId: string;
  skor: number;
  /** Ringkasan kontur pitch untuk ditampilkan ulang di riwayat. */
  ringkasanKontur: Array<{ waktu: number; midi: number | null }>;
};

/**
 * FR-16 Simpan riwayat latihan. Server menyimpan riwayat_latihan dan
 * menandai sesi_analisis selesai sehingga dihitung sebagai satu kuota.
 * Rekaman suara tidak pernah dikirim (NFR-07).
 */
export async function simpanRiwayat(data: DataRiwayat): Promise<void> {
  void data;
  // TODO: sambungkan ke Supabase (API route POST /api/riwayat)
  throw new BelumTersambungError();
}

/**
 * UC-14 Melihat Riwayat Latihan. Khusus pengguna Premium dan Uji Coba;
 * server menolak permintaan dari pengguna Gratis.
 */
export async function getRiwayatList(): Promise<ItemRiwayat[]> {
  // TODO: sambungkan ke Supabase (tabel riwayat_latihan milik pengguna, urut terbaru)
  return [];
}

/** Detail satu riwayat: skor, kontur nada, dan nada yang meleset. */
export async function getRiwayatById(id: string): Promise<DetailRiwayat | null> {
  void id;
  // TODO: sambungkan ke Supabase (riwayat_latihan + nada acuan materi)
  return null;
}

/** UC-15 Grafik Progres: skor per latihan dari waktu ke waktu (khusus Premium). */
export async function getProgres(): Promise<TitikProgres[]> {
  // TODO: sambungkan ke Supabase (riwayat_latihan milik pengguna, urut tanggal)
  return [];
}

/** Data untuk Dashboard Pengguna. */
export async function getRingkasanDashboard(): Promise<RingkasanDashboard> {
  // TODO: sambungkan ke Supabase (users, sesi_analisis, riwayat_latihan)
  return {
    pengguna: null,
    sisaKuota: null,
    materiTerakhir: null,
    skorTerbaru: null,
  };
}
