import { ambilSemua, rentangWib, wajibAdmin } from "@/lib/server/admin";
import { rute } from "@/lib/server/respons";
import { klienAdmin } from "@/lib/supabase/admin";
import type { KodePaketBerbayar, StatusTransaksi, TransaksiAdmin } from "@/lib/types";

const STATUS_SAH: StatusTransaksi[] = ["tertunda", "berhasil", "gagal", "kedaluwarsa"];

type BarisTransaksi = {
  order_id: string;
  paket: KodePaketBerbayar;
  nominal: number;
  metode: string | null;
  status: StatusTransaksi;
  created_at: string;
  paid_at: string | null;
  users: { nama: string; email: string } | null;
};

export const GET = rute(async (req: Request) => {
  await wajibAdmin();
  const param = new URL(req.url).searchParams;
  const rentang = rentangWib(param, null);
  const status = param.get("status") as StatusTransaksi | null;

  const baris = await ambilSemua<BarisTransaksi>((dari, sampai) => {
    let kueri = klienAdmin()
      .from("transaksi")
      .select("order_id, paket, nominal, metode, status, created_at, paid_at, users(nama, email)");
    if (rentang.awal) kueri = kueri.gte("created_at", rentang.awal);
    if (rentang.akhir) kueri = kueri.lt("created_at", rentang.akhir);
    if (status && STATUS_SAH.includes(status)) kueri = kueri.eq("status", status);
    return kueri.order("created_at", { ascending: false }).range(dari, sampai);
  });

  const transaksi: TransaksiAdmin[] = baris.map((t) => ({
    orderId: t.order_id,
    paket: t.paket,
    nominal: t.nominal,
    metode: t.metode,
    status: t.status,
    dibuat: t.created_at,
    dibayar: t.paid_at,
    namaPengguna: t.users?.nama ?? "Pengguna dihapus",
    emailPengguna: t.users?.email ?? "—",
  }));
  return Response.json({ transaksi });
});
