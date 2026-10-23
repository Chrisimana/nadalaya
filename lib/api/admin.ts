/*
 * Fungsi data untuk halaman admin. Seluruh endpoint admin memeriksa sesi,
 * status akun, dan peran admin di server (SDD 3.2.7).
 */
import type {
  DetailPenggunaAdmin,
  JenisMateri,
  MateriAdmin,
  PenggunaAdmin,
  RingkasanAdmin,
  StatistikLatihan,
  StatusTransaksi,
  TingkatMateri,
  TransaksiAdmin,
} from "@/lib/types";
import { GalatApi } from "./galat";
import { minta } from "./klien";

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

function parameter(isi: Record<string, string | undefined>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(isi)) if (v) p.set(k, v);
  const teks = p.toString();
  return teks ? `?${teks}` : "";
}

/** null bila server menjawab 404 (data tidak ditemukan). */
async function atauNull<T>(janji: Promise<T>): Promise<T | null> {
  try {
    return await janji;
  } catch (err) {
    if (err instanceof GalatApi && (err.status === 404 || err.status === 400)) return null;
    throw err;
  }
}

/** Ringkasan untuk Dashboard Admin. */
export async function getRingkasanAdmin(): Promise<RingkasanAdmin> {
  return minta<RingkasanAdmin>("/api/admin/ringkasan");
}

/** UC-20 Melihat Data Materi (termasuk yang nonaktif). */
export async function getMateriAdminList(
  filter: { cari?: string; jenis?: JenisMateri; tingkat?: TingkatMateri } = {},
): Promise<MateriAdmin[]> {
  const hasil = await minta<{ materi: MateriAdmin[] }>(`/api/admin/materi${parameter(filter)}`);
  return hasil.materi;
}

export async function getMateriAdminById(id: string): Promise<MateriAdmin | null> {
  const hasil = await atauNull(minta<{ materi: MateriAdmin }>(`/api/admin/materi/${encodeURIComponent(id)}`));
  return hasil?.materi ?? null;
}

/**
 * UC-21 Menambahkan dan UC-22 Mengubah Data Materi. Server memvalidasi bahwa
 * berkas .mid dapat dibaca @tonejs/midi dan berisi melodi tunggal.
 */
export async function simpanMateri(data: DataMateri, id?: string): Promise<MateriAdmin> {
  const form = new FormData();
  form.set("judul", data.judul);
  form.set("jenis", data.jenis);
  form.set("tingkat", data.tingkat);
  form.set("isPremium", String(data.isPremium));
  form.set("tempo", String(data.tempo));
  if (data.berkasMidi) form.set("berkas", data.berkasMidi);

  const hasil = await minta<{ materi: MateriAdmin }>(
    id ? `/api/admin/materi/${encodeURIComponent(id)}` : "/api/admin/materi",
    { method: id ? "PATCH" : "POST", body: form },
  );
  return hasil.materi;
}

/**
 * UC-23 Menghapus Data Materi. Materi yang sudah dipakai latihan hanya
 * dinonaktifkan agar riwayat pengguna tetap utuh.
 */
export async function hapusMateri(id: string): Promise<{ dinonaktifkan: boolean }> {
  return minta(`/api/admin/materi/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/** Mengaktifkan kembali materi yang nonaktif. */
export async function aktifkanMateri(id: string): Promise<void> {
  await minta(`/api/admin/materi/${encodeURIComponent(id)}/aktifkan`, { method: "PATCH" });
}

/** UC-24 Melihat Data Pengguna (status paket efektif). */
export async function getPenggunaAdminList(
  filter: { cari?: string; paket?: string } = {},
): Promise<PenggunaAdmin[]> {
  const hasil = await minta<{ pengguna: PenggunaAdmin[] }>(`/api/admin/pengguna${parameter(filter)}`);
  return hasil.pengguna;
}

/** Detail pengguna beserta 5 latihan terakhir. */
export async function getPenggunaAdminById(id: string): Promise<DetailPenggunaAdmin | null> {
  const hasil = await atauNull(
    minta<{ pengguna: DetailPenggunaAdmin }>(`/api/admin/pengguna/${encodeURIComponent(id)}`),
  );
  return hasil?.pengguna ?? null;
}

/** UC-25 Menonaktifkan Akun Pengguna dan mencabut seluruh sesinya. */
export async function nonaktifkanPengguna(id: string): Promise<void> {
  await minta(`/api/admin/pengguna/${encodeURIComponent(id)}/nonaktifkan`, { method: "POST" });
}

/** Mengaktifkan kembali akun pengguna. */
export async function aktifkanPengguna(id: string): Promise<void> {
  await minta(`/api/admin/pengguna/${encodeURIComponent(id)}/aktifkan`, { method: "POST" });
}

/** UC-26 Melihat Statistik Latihan (bawaan server: 30 hari terakhir, WIB). */
export async function getStatistikLatihan(rentang: RentangTanggal): Promise<StatistikLatihan> {
  return minta<StatistikLatihan>(`/api/admin/statistik${parameter(rentang)}`);
}

/** UC-27 Melihat Laporan Transaksi. */
export async function getTransaksiAdminList(
  filter: RentangTanggal & { status?: StatusTransaksi },
): Promise<TransaksiAdmin[]> {
  const hasil = await minta<{ transaksi: TransaksiAdmin[] }>(`/api/admin/transaksi${parameter(filter)}`);
  return hasil.transaksi;
}
