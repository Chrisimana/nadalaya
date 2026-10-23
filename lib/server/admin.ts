import "server-only";

import { klienAdmin } from "@/lib/supabase/admin";
import type { JenisMateri, TingkatMateri } from "@/lib/types";
import { wajibLogin, type KonteksPengguna } from "./pengguna";
import { GalatRute } from "./respons";

export async function wajibAdmin(): Promise<KonteksPengguna> {
  return wajibLogin({ peran: "admin" });
}

const UKURAN_HALAMAN = 1000;

export async function ambilSemua<T>(
  kueri: (dari: number, sampai: number) => PromiseLike<{ data: unknown; error: unknown }>,
): Promise<T[]> {
  const hasil: T[] = [];
  for (let dari = 0; ; dari += UKURAN_HALAMAN) {
    const { data, error } = await kueri(dari, dari + UKURAN_HALAMAN - 1);
    if (error) throw error;
    const baris = (data ?? []) as T[];
    hasil.push(...baris);
    if (baris.length < UKURAN_HALAMAN) return hasil;
  }
}

export async function hitung(tabel: string, filter: Record<string, string | boolean> = {}): Promise<number> {
  let kueri = klienAdmin().from(tabel).select("*", { count: "exact", head: true });
  for (const [kolom, nilai] of Object.entries(filter)) kueri = kueri.eq(kolom, nilai);
  const { count, error } = await kueri;
  if (error) throw error;
  return count ?? 0;
}


export const JENIS_SAH: JenisMateri[] = ["tangga_nada", "interval", "melodi"];
export const TINGKAT_KE_ANGKA: Record<TingkatMateri, number> = { dasar: 1, menengah: 2, mahir: 3 };

export function bersihkanCari(nilai: string | null) {
  return (nilai ?? "").replace(/[%*,()\\]/g, " ").trim().slice(0, 100);
}

export function keTingkat(nilai: unknown): number | null {
  if (typeof nilai !== "string") return null;
  if (nilai in TINGKAT_KE_ANGKA) return TINGKAT_KE_ANGKA[nilai as TingkatMateri];
  const angka = Number(nilai);
  return Number.isInteger(angka) && angka >= 1 && angka <= 3 ? angka : null;
}

const POLA_TANGGAL = /^\d{4}-\d{2}-\d{2}$/;
const SATU_HARI = 24 * 60 * 60 * 1000;

export function tanggalWib(waktu: Date | string) {
  return new Date(new Date(waktu).getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function rentangWib(cari: URLSearchParams, bawaanHari: number | null = 30) {
  const dari = cari.get("dari");
  const sampai = cari.get("sampai");
  for (const t of [dari, sampai]) {
    if (t && (!POLA_TANGGAL.test(t) || Number.isNaN(Date.parse(`${t}T00:00:00+07:00`)))) {
      throw new GalatRute(400, "Format tanggal tidak valid.", "permintaan_tidak_valid");
    }
  }

  const hariIni = tanggalWib(new Date());
  const tanggalSampai = sampai ?? (bawaanHari === null && !dari ? null : hariIni);
  const tanggalDari =
    dari ??
    (bawaanHari === null
      ? null
      : tanggalWib(new Date(Date.parse(`${tanggalSampai ?? hariIni}T00:00:00+07:00`) - (bawaanHari - 1) * SATU_HARI)));
  if (tanggalDari && tanggalSampai && tanggalDari > tanggalSampai) {
    throw new GalatRute(400, "Tanggal akhir tidak boleh sebelum tanggal awal.", "permintaan_tidak_valid");
  }

  return {
    tanggalDari,
    tanggalSampai,
    awal: tanggalDari ? new Date(`${tanggalDari}T00:00:00+07:00`).toISOString() : null,
    akhir: tanggalSampai
      ? new Date(Date.parse(`${tanggalSampai}T00:00:00+07:00`) + SATU_HARI).toISOString()
      : null,
  };
}

export function daftarTanggal(dari: string, sampai: string) {
  const hasil: string[] = [];
  for (let t = Date.parse(`${dari}T00:00:00Z`); t <= Date.parse(`${sampai}T00:00:00Z`); t += SATU_HARI) {
    hasil.push(new Date(t).toISOString().slice(0, 10));
    if (hasil.length > 366) break;
  }
  return hasil;
}
