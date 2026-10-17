import type { Pengguna } from "@/lib/types";
import { BelumTersambungError } from "./galat";

export type DataRegistrasi = {
  nama: string;
  email: string;
  kataSandi: string;
};

export type DataMasuk = {
  email: string;
  kataSandi: string;
};

/** UC-01 Mendaftar Akun. Akun baru otomatis berstatus Gratis (FR-01). */
export async function register(data: DataRegistrasi): Promise<void> {
  void data;
  // TODO: sambungkan ke Supabase (supabase.auth.signUp + baris tabel users)
  throw new BelumTersambungError();
}

/** UC-02 Masuk ke Sistem. Mengembalikan pengguna untuk pengalihan sesuai peran. */
export async function login(data: DataMasuk): Promise<Pengguna> {
  void data;
  // TODO: sambungkan ke Supabase (supabase.auth.signInWithPassword, cek is_aktif)
  throw new BelumTersambungError();
}

/** UC-04 Keluar dari Sistem. */
export async function logout(): Promise<void> {
  // TODO: sambungkan ke Supabase (supabase.auth.signOut)
  throw new BelumTersambungError();
}

/** UC-03 langkah 2: mengirim tautan atur ulang kata sandi ke email. */
export async function kirimTautanResetSandi(email: string): Promise<void> {
  void email;
  // TODO: sambungkan ke Supabase (supabase.auth.resetPasswordForEmail,
  // redirectTo /atur-ulang-kata-sandi)
  throw new BelumTersambungError();
}

/**
 * UC-03 langkah 4: menyimpan kata sandi baru dari tautan email.
 * Melempar TautanKedaluwarsaError bila sesi pemulihan sudah tidak berlaku.
 */
export async function simpanKataSandiBaru(kataSandi: string): Promise<void> {
  void kataSandi;
  // TODO: sambungkan ke Supabase (supabase.auth.updateUser({ password }))
  throw new BelumTersambungError();
}

/** Mengirim ulang email verifikasi akun (UC-01 langkah 3.3). */
export async function kirimUlangVerifikasi(email: string): Promise<void> {
  void email;
  // TODO: sambungkan ke Supabase (supabase.auth.resend({ type: "signup", email }))
  throw new BelumTersambungError();
}

/** UC-05 Mengubah Profil: hanya nama yang dapat diubah. */
export async function ubahNama(nama: string): Promise<void> {
  void nama;
  // TODO: sambungkan ke Supabase (update tabel users kolom nama)
  throw new BelumTersambungError();
}

/** Mengambil pengguna yang sedang masuk, null bila belum masuk. */
export async function getPenggunaSaatIni(): Promise<Pengguna | null> {
  // TODO: sambungkan ke Supabase (supabase.auth.getUser + tabel users)
  return null;
}
