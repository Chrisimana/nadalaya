import type {
  InfoLangganan,
  KodePaketBerbayar,
  StatusPaket,
  Transaksi,
} from "@/lib/types";
import { GalatApi } from "./galat";
import { minta } from "./klien";

export type StatusPaketDanKuota = InfoLangganan & {
  sisaKuota: number | null;
  waktuReset: string;
};

export async function getStatusPaketDanKuota(): Promise<StatusPaketDanKuota> {
  return minta<StatusPaketDanKuota>("/api/paket");
}

export async function getStatusPaket(): Promise<StatusPaket> {
  return (await getStatusPaketDanKuota()).statusPaket;
}

export async function aktifkanUjiCoba(): Promise<{ tanggalBerakhir: string }> {
  return minta<{ tanggalBerakhir: string }>("/api/uji-coba", { method: "POST" });
}

export async function getInfoLangganan(): Promise<InfoLangganan> {
  const { statusPaket, tanggalBerakhir, ujiCobaDigunakan } = await getStatusPaketDanKuota();
  return { statusPaket, tanggalBerakhir, ujiCobaDigunakan };
}

export async function buatPesanan(
  paket: KodePaketBerbayar,
): Promise<{ orderId: string; snapToken: string }> {
  return minta<{ orderId: string; snapToken: string }>("/api/pembayaran", { method: "POST", body: { paket } });
}

/** Transaksi milik pengguna sendiri; null bila tidak ditemukan. */
export async function getTransaksi(orderId: string): Promise<Transaksi | null> {
  try {
    return (await minta<{ transaksi: Transaksi }>(`/api/pembayaran/${encodeURIComponent(orderId)}`)).transaksi;
  } catch (err) {
    if (err instanceof GalatApi && err.status === 404) return null;
    throw err;
  }
}
