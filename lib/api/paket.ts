import type {
  InfoLangganan,
  KodePaketBerbayar,
  StatusPaket,
  Transaksi,
} from "@/lib/types";
import { BelumTersambungError } from "./galat";
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
  throw new BelumTersambungError();
}

export async function getInfoLangganan(): Promise<InfoLangganan> {
  const { statusPaket, tanggalBerakhir, ujiCobaDigunakan } = await getStatusPaketDanKuota();
  return { statusPaket, tanggalBerakhir, ujiCobaDigunakan };
}

export async function buatPesanan(
  paket: KodePaketBerbayar,
): Promise<{ orderId: string; snapToken: string }> {
  void paket;
  // TODO: sambungkan ke Midtrans (API route POST /api/pembayaran).
  throw new BelumTersambungError();
}

export async function getTransaksi(orderId: string): Promise<Transaksi | null> {
  void orderId;
  // TODO: sambungkan ke Supabase (tabel transaksi, dibatasi RLS milik pengguna)
  return null;
}
