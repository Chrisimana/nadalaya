import { buatOrderId, isiPermintaanSnap, kodePaketSah, PAKET_BERBAYAR } from "@/lib/midtrans";
import { PEMBATAS } from "@/lib/pembatas";
import { mintaTokenSnap } from "@/lib/server/pembayaran";
import { batasi } from "@/lib/server/pembatas";
import { wajibLogin } from "@/lib/server/pengguna";
import { bacaJson, GalatRute, rute } from "@/lib/server/respons";
import { klienAdmin } from "@/lib/supabase/admin";

export const POST = rute(async (req: Request) => {
  const { uid, profil } = await wajibLogin();
  const isi = await bacaJson(req);
  if (!kodePaketSah(isi.paket)) throw new GalatRute(400, "Paket tidak valid.", "data_tidak_valid");
  if (profil.peran === "admin") {
    throw new GalatRute(403, "Akun admin tidak dapat membeli paket.", "admin_tidak_membeli");
  }
  await batasi([[PEMBATAS.pembayaranPengguna, uid]]);

  // Nominal hanya dari server; nilai dari klien tidak dipakai.
  const paket = isi.paket;
  const orderId = buatOrderId();
  const { error } = await klienAdmin()
    .from("transaksi")
    .insert({ order_id: orderId, user_id: uid, paket, nominal: PAKET_BERBAYAR[paket].harga, status: "tertunda" } as never);
  if (error) throw error;

  const snapToken = await mintaTokenSnap(isiPermintaanSnap({ orderId, paket, nama: profil.nama, email: profil.email }));
  if (!snapToken) {
    await klienAdmin()
      .from("transaksi")
      .update({ status: "gagal" } as never)
      .eq("order_id", orderId)
      .eq("status", "tertunda");
    throw new GalatRute(
      502,
      "Halaman pembayaran belum dapat dibuat. Silakan coba lagi beberapa saat lagi.",
      "pembayaran_gagal_dibuat",
    );
  }

  return Response.json({ orderId, snapToken });
});
