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

export async function register(data: DataRegistrasi): Promise<{ perluVerifikasi: boolean }> {
  return minta("/api/auth/daftar", { method: "POST", body: data, alihkanBilaKeluar: false });
}

export async function login(data: DataMasuk): Promise<Pengguna> {
  const hasil = await minta<{ pengguna: Pengguna }>("/api/auth/masuk", {
    method: "POST",
    body: data,
    alihkanBilaKeluar: false,
  });
  return hasil.pengguna;
}

export async function logout(): Promise<void> {
  await minta("/api/auth/keluar", { method: "POST", alihkanBilaKeluar: false });
}

export async function kirimTautanResetSandi(email: string): Promise<void> {
  await minta("/api/auth/lupa-sandi", { method: "POST", body: { email }, alihkanBilaKeluar: false });
}

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

export async function kirimUlangVerifikasi(email: string): Promise<void> {
  await minta("/api/auth/kirim-ulang-verifikasi", {
    method: "POST",
    body: { email },
    alihkanBilaKeluar: false,
  });
}

export async function ubahNama(nama: string): Promise<Pengguna> {
  const hasil = await minta<{ pengguna: Pengguna }>("/api/profil", {
    method: "PATCH",
    body: { nama },
  });
  return hasil.pengguna;
}

export async function getPenggunaSaatIni(): Promise<Pengguna> {
  const hasil = await minta<{ pengguna: Pengguna }>("/api/profil");
  return hasil.pengguna;
}
