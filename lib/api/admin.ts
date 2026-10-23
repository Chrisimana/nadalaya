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
  dari?: string;
  sampai?: string;
};

export type DataMateri = {
  judul: string;
  jenis: JenisMateri;
  tingkat: TingkatMateri;
  isPremium: boolean;
  tempo: number;
  berkasMidi: File | null;
};

function parameter(isi: Record<string, string | undefined>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(isi)) if (v) p.set(k, v);
  const teks = p.toString();
  return teks ? `?${teks}` : "";
}

async function atauNull<T>(janji: Promise<T>): Promise<T | null> {
  try {
    return await janji;
  } catch (err) {
    if (err instanceof GalatApi && (err.status === 404 || err.status === 400)) return null;
    throw err;
  }
}

export async function getRingkasanAdmin(): Promise<RingkasanAdmin> {
  return minta<RingkasanAdmin>("/api/admin/ringkasan");
}

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

export async function hapusMateri(id: string): Promise<{ dinonaktifkan: boolean }> {
  return minta(`/api/admin/materi/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function aktifkanMateri(id: string): Promise<void> {
  await minta(`/api/admin/materi/${encodeURIComponent(id)}/aktifkan`, { method: "PATCH" });
}

export async function getPenggunaAdminList(
  filter: { cari?: string; paket?: string } = {},
): Promise<PenggunaAdmin[]> {
  const hasil = await minta<{ pengguna: PenggunaAdmin[] }>(`/api/admin/pengguna${parameter(filter)}`);
  return hasil.pengguna;
}

export async function getPenggunaAdminById(id: string): Promise<DetailPenggunaAdmin | null> {
  const hasil = await atauNull(
    minta<{ pengguna: DetailPenggunaAdmin }>(`/api/admin/pengguna/${encodeURIComponent(id)}`),
  );
  return hasil?.pengguna ?? null;
}

export async function nonaktifkanPengguna(id: string): Promise<void> {
  await minta(`/api/admin/pengguna/${encodeURIComponent(id)}/nonaktifkan`, { method: "POST" });
}

export async function aktifkanPengguna(id: string): Promise<void> {
  await minta(`/api/admin/pengguna/${encodeURIComponent(id)}/aktifkan`, { method: "POST" });
}

export async function getStatistikLatihan(rentang: RentangTanggal): Promise<StatistikLatihan> {
  return minta<StatistikLatihan>(`/api/admin/statistik${parameter(rentang)}`);
}

export async function getTransaksiAdminList(
  filter: RentangTanggal & { status?: StatusTransaksi },
): Promise<TransaksiAdmin[]> {
  const hasil = await minta<{ transaksi: TransaksiAdmin[] }>(`/api/admin/transaksi${parameter(filter)}`);
  return hasil.transaksi;
}
