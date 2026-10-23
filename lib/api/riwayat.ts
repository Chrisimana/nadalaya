import type {
  DetailRiwayat,
  HasilAnalisis,
  ItemRiwayat,
  RingkasanDashboard,
  TitikProgres,
} from "@/lib/types";
import { GalatApi } from "./galat";
import { minta } from "./klien";

export type DataRiwayat = {
  sesiId: string;
  hasil: HasilAnalisis;
};

const MAKS_TITIK_KONTUR = 1500;

function ringkasKontur(kontur: HasilAnalisis["kontur"]) {
  if (kontur.length <= MAKS_TITIK_KONTUR) return kontur;
  const langkah = kontur.length / MAKS_TITIK_KONTUR;
  return Array.from({ length: MAKS_TITIK_KONTUR }, (_, i) => kontur[Math.floor(i * langkah)]);
}

export async function simpanRiwayat({ sesiId, hasil }: DataRiwayat): Promise<void> {
  await minta(`/api/sesi/${encodeURIComponent(sesiId)}/hasil`, {
    method: "POST",
    body: {
      skor: hasil.skor,
      kontur: ringkasKontur(hasil.kontur),
      acuan: hasil.acuan,
      nadaMeleset: hasil.nadaMeleset,
    },
  });
}

export async function getRiwayatList(): Promise<ItemRiwayat[]> {
  const hasil = await minta<{ riwayat: ItemRiwayat[] }>("/api/riwayat");
  return hasil.riwayat;
}

export async function getRiwayatById(id: string): Promise<DetailRiwayat | null> {
  try {
    const hasil = await minta<{ riwayat: DetailRiwayat }>(`/api/riwayat/${encodeURIComponent(id)}`);
    return hasil.riwayat;
  } catch (err) {
    if (err instanceof GalatApi && (err.status === 404 || err.status === 400)) return null;
    throw err;
  }
}

export async function getProgres(): Promise<TitikProgres[]> {
  const hasil = await minta<{ progres: TitikProgres[] }>("/api/progres");
  return hasil.progres;
}

export async function getRingkasanDashboard(): Promise<RingkasanDashboard> {
  return minta<RingkasanDashboard>("/api/dashboard");
}
