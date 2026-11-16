import { wajibLogin } from "@/lib/server/pengguna";
import { GalatRute, rute } from "@/lib/server/respons";
import type { KodePaketBerbayar, StatusTransaksi, Transaksi } from "@/lib/types";

const POLA_ORDER_ID = /^[A-Za-z0-9_.~-]{1,64}$/;

type BarisTransaksi = {
  order_id: string;
  paket: KodePaketBerbayar;
  nominal: number;
  metode: string | null;
  status: StatusTransaksi;
  created_at: string;
  paid_at: string | null;
};

export const GET = rute(async (_req: Request, { params }: RouteContext<"/api/pembayaran/[orderId]">) => {
  const { supabase } = await wajibLogin();
  const { orderId } = await params;
  if (!POLA_ORDER_ID.test(orderId)) throw new GalatRute(400, "ID pesanan tidak valid.", "permintaan_tidak_valid");

  // Klien sesi pengguna: RLS hanya mengizinkan transaksi milik sendiri.
  const { data, error } = await supabase
    .from("transaksi")
    .select("order_id, paket, nominal, metode, status, created_at, paid_at")
    .eq("order_id", orderId)
    .maybeSingle<BarisTransaksi>();
  if (error) throw error;
  if (!data) throw new GalatRute(404, "Transaksi tidak ditemukan.", "transaksi_tidak_ditemukan");

  const transaksi: Transaksi = {
    orderId: data.order_id,
    paket: data.paket,
    nominal: data.nominal,
    metode: data.metode,
    status: data.status,
    dibuat: data.created_at,
    dibayar: data.paid_at,
  };
  return Response.json({ transaksi });
});
