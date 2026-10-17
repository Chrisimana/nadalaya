import { wajibLogin, wajibPremium } from "@/lib/server/pengguna";
import { rute } from "@/lib/server/respons";
import { KOLOM_RIWAYAT, keItemRiwayat, type BarisRiwayat } from "@/lib/server/riwayat";
import { klienAdmin } from "@/lib/supabase/admin";

/** UC-14 Melihat Riwayat Latihan: khusus Premium dan Uji Coba, terbaru lebih dulu. */
export const GET = rute(async () => {
  const konteks = await wajibLogin();
  wajibPremium(konteks);

  // Klien admin agar judul materi yang sudah dinonaktifkan tetap terbaca.
  const { data, error } = await klienAdmin()
    .from("riwayat_latihan")
    .select(KOLOM_RIWAYAT)
    .eq("user_id", konteks.uid)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;

  return Response.json({ riwayat: (data as unknown as BarisRiwayat[]).map(keItemRiwayat) });
});
