import { prosesNotifikasi } from "@/lib/midtrans";
import { ambilStatusMidtrans, kunciSignature } from "@/lib/server/pembayaran";
import { bacaJson, rute } from "@/lib/server/respons";
import { klienAdmin } from "@/lib/supabase/admin";

// Webhook Midtrans: tanpa sesi dan tanpa pemeriksaan Origin; keasliannya dijamin signature_key.
export const POST = rute(
  async (req: Request) => {
    const isi = await bacaJson(req);
    const hasil = await prosesNotifikasi(isi, {
      kunciSignature: kunciSignature(),
      async cariTransaksi(orderId) {
        const { data, error } = await klienAdmin()
          .from("transaksi")
          .select("nominal")
          .eq("order_id", orderId)
          .maybeSingle<{ nominal: number }>();
        if (error) throw error;
        return data;
      },
      ambilStatus: ambilStatusMidtrans,
      async proses({ orderId, status, metode, dibayar }) {
        const { data, error } = await klienAdmin().rpc("proses_pembayaran", {
          p_order_id: orderId,
          p_status: status,
          p_metode: metode,
          p_paid_at: dibayar,
        } as never);
        if (error) throw error;
        return data as string;
      },
    });

    if (hasil.status === 403) console.warn("[pembayaran] notifikasi dengan tanda tangan tidak valid ditolak");
    else if (hasil.status !== 200) console.warn("[pembayaran] notifikasi ditolak", hasil.status, String(hasil.isi.pesan ?? ""));
    return Response.json(hasil.isi, { status: hasil.status });
  },
  { tanpaPemeriksaanAsal: true },
);
