import type { Pengguna } from "@/lib/types";
import { GalatApi, TautanKedaluwarsaError } from "./galat";
import { minta } from "./klien";

export type DataRegistrasi = {
  nama: string;
  email: string;
  kataSandi: string;
};

export type DataMasuk = {
  email: string;
  kataSandi: string;
};

/**
 * UC-01 Mendaftar Akun. Akun baru otomatis berstatus Gratis (FR-01).
 * `perluVerifikasi` false bila verifikasi email dimatikan di Supabase.
 */
export async function register(data: DataRegistrasi): Promise<{ perluVerifikasi: boolean }> {
  return minta("/api/auth/daftar", { method: "POST", body: data, alihkanBilaKeluar: false });
}

/** UC-02 Masuk ke Sistem. Mengembalikan pengguna untuk pengalihan sesuai peran. */
export async function login(data: DataMasuk): Promise<Pengguna> {
  const hasil = await minta<{ pengguna: Pengguna }>("/api/auth/masuk", {
    method: "POST",
    body: data,
    alihkanBilaKeluar: false,
  });
  return hasil.pengguna;
}

/** UC-04 Keluar dari Sistem. */
export async function logout(): Promise<void> {
  await minta("/api/auth/keluar", { method: "POST", alihkanBilaKeluar: false });
}

/** UC-03 langkah 2: mengirim tautan atur ulang kata sandi ke email. */
export async function kirimTautanResetSandi(email: string): Promise<void> {
  await minta("/api/auth/lupa-sandi", { method: "POST", body: { email }, alihkanBilaKeluar: false });
}

/**
 * UC-03 langkah 4: menyimpan kata sandi baru dari tautan email.
 * Melempar TautanKedaluwarsaError bila sesi pemulihan sudah tidak berlaku.
 */
export async function simpanKataSandiBaru(kataSandi: string): Promise<void> {
  try {
    await minta("/api/auth/atur-ulang-sandi", {
      method: "POST",
      body: { kataSandi },
      alihkanBilaKeluar: false,
    });
  } catch (err) {
    if (err instanceof GalatApi && err.kode === "tautan_kedaluwarsa") {
      throw new TautanKedaluwarsaError();
    }
    throw err;
  }
}

/** Mengirim ulang email verifikasi akun (UC-01 langkah 3.3). */
export async function kirimUlangVerifikasi(email: string): Promise<void> {
  await minta("/api/auth/kirim-ulang-verifikasi", {
    method: "POST",
    body: { email },
    alihkanBilaKeluar: false,
  });
}

/** UC-05 Mengubah Profil: hanya nama yang dapat diubah. */
export async function ubahNama(nama: string): Promise<Pengguna> {
  const hasil = await minta<{ pengguna: Pengguna }>("/api/profil", {
    method: "PATCH",
    body: { nama },
  });
  return hasil.pengguna;
}

/** Mengambil pengguna yang sedang masuk. */
export async function getPenggunaSaatIni(): Promise<Pengguna> {
  const hasil = await minta<{ pengguna: Pengguna }>("/api/profil");
  return hasil.pengguna;
}
