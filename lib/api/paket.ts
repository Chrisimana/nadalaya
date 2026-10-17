import type {
  InfoLangganan,
  KodePaketBerbayar,
  StatusPaket,
  Transaksi,
} from "@/lib/types";
import { BelumTersambungError } from "./galat";

/**
 * Status paket efektif pengguna yang sedang masuk. Server memperlakukan
 * paket yang melewati tanggal berakhir sebagai Gratis (SDD 3.2.4).
 */
export async function getStatusPaket(): Promise<StatusPaket> {
  // TODO: sambungkan ke Supabase (API route: getStatusEfektif(user)).
  // Selama belum tersambung, nilai bawaan adalah paket Gratis.
  return "gratis";
}

/** UC-16 Mengaktifkan Uji Coba Premium 7 hari, satu kali per akun (FR-18). */
export async function aktifkanUjiCoba(): Promise<{ tanggalBerakhir: string }> {
  // TODO: sambungkan ke Supabase (API route POST /api/uji-coba; cek uji_coba_digunakan)
  throw new BelumTersambungError();
}

/** Status paket, tanggal berakhir, dan riwayat uji coba untuk halaman Langganan. */
export async function getInfoLangganan(): Promise<InfoLangganan> {
  // TODO: sambungkan ke Supabase (tabel users: status_paket, tanggal_berakhir,
  // uji_coba_digunakan). Nilai bawaan: paket Gratis yang belum pernah uji coba.
  return { statusPaket: "gratis", tanggalBerakhir: null, ujiCobaDigunakan: false };
}

/**
 * UC-17 Membeli Paket Langganan: membuat pesanan berstatus tertunda lalu
 * mengembalikan token Midtrans Snap untuk membuka pop-up pembayaran (UC-18).
 */
export async function buatPesanan(
  paket: KodePaketBerbayar,
): Promise<{ orderId: string; snapToken: string }> {
  void paket;
  // TODO: sambungkan ke Supabase (API route POST /api/pembayaran; server key
  // Midtrans hanya di server, enabled_payments: VA dan QRIS)
  throw new BelumTersambungError();
}

/** Ringkasan satu transaksi milik pengguna untuk halaman status pembayaran. */
export async function getTransaksi(orderId: string): Promise<Transaksi | null> {
  void orderId;
  // TODO: sambungkan ke Supabase (tabel transaksi, dibatasi RLS milik pengguna)
  return null;
}
