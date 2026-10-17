/*
 * Fungsi data untuk halaman admin. Seluruh endpoint admin wajib diperiksa
 * perannya di server (SDD 3.2.7).
 */
import type {
  JenisMateri,
  MateriAdmin,
  PenggunaAdmin,
  RingkasanAdmin,
  StatistikLatihan,
  StatusTransaksi,
  TingkatMateri,
  TransaksiAdmin,
} from "@/lib/types";
import { BelumTersambungError } from "./galat";

export type RentangTanggal = {
  /** Format YYYY-MM-DD, kosong berarti tanpa batas. */
  dari?: string;
  sampai?: string;
};

export type DataMateri = {
  judul: string;
  jenis: JenisMateri;
  tingkat: TingkatMateri;
  isPremium: boolean;
  tempo: number;
  /** Wajib saat menambah; opsional saat mengubah (berkas lama tetap dipakai). */
  berkasMidi: File | null;
};

/** Ringkasan untuk Dashboard Admin. */
export async function getRingkasanAdmin(): Promise<RingkasanAdmin> {
  // TODO: sambungkan ke Supabase (hitung users, riwayat_latihan, transaksi berhasil)
  return { jumlahPengguna: 0, jumlahLatihan: 0, transaksiBerhasil: 0, pendapatan: 0 };
}

/** UC-20 Melihat Data Materi. */
export async function getMateriAdminList(): Promise<MateriAdmin[]> {
  // TODO: sambungkan ke Supabase (tabel materi_latihan, termasuk yang nonaktif)
  return [];
}

export async function getMateriAdminById(id: string): Promise<MateriAdmin | null> {
  void id;
  // TODO: sambungkan ke Supabase (tabel materi_latihan)
  return null;
}

/**
 * UC-21 Menambahkan dan UC-22 Mengubah Data Materi. Server memvalidasi bahwa
 * berkas .mid dapat dibaca @tonejs/midi dan berisi melodi tunggal.
 */
export async function simpanMateri(data: DataMateri, id?: string): Promise<void> {
  void data;
  void id;
  // TODO: sambungkan ke Supabase (unggah ke Storage, simpan midi_path,
  // hapus berkas lama bila diganti)
  throw new BelumTersambungError();
}

/**
 * UC-23 Menghapus Data Materi. Materi yang sudah dipakai latihan hanya
 * dinonaktifkan agar riwayat pengguna tetap utuh.
 */
export async function hapusMateri(id: string): Promise<{ dinonaktifkan: boolean }> {
  void id;
  // TODO: sambungkan ke Supabase (hapus atau set is_aktif = false)
  throw new BelumTersambungError();
}

/** UC-24 Melihat Data Pengguna. */
export async function getPenggunaAdminList(): Promise<PenggunaAdmin[]> {
  // TODO: sambungkan ke Supabase (tabel users dengan status paket efektif)
  return [];
}

export async function getPenggunaAdminById(id: string): Promise<PenggunaAdmin | null> {
  void id;
  // TODO: sambungkan ke Supabase (tabel users)
  return null;
}

/** UC-25 Menonaktifkan Akun Pengguna dan mencabut seluruh sesinya. */
export async function nonaktifkanPengguna(id: string): Promise<void> {
  void id;
  // TODO: sambungkan ke Supabase (is_aktif = false + auth.admin.signOut)
  throw new BelumTersambungError();
}

/** UC-26 Melihat Statistik Latihan. */
export async function getStatistikLatihan(rentang: RentangTanggal): Promise<StatistikLatihan> {
  void rentang;
  // TODO: sambungkan ke Supabase (agregasi riwayat_latihan per hari, WIB)
  return {
    jumlahSesi: 0,
    rataRataSkor: null,
    materiTerpopuler: null,
    penggunaAktif: 0,
    perHari: [],
  };
}

/** UC-27 Melihat Laporan Transaksi. */
export async function getTransaksiAdminList(
  filter: RentangTanggal & { status?: StatusTransaksi },
): Promise<TransaksiAdmin[]> {
  void filter;
  // TODO: sambungkan ke Supabase (tabel transaksi join users)
  return [];
}
