import { BATAS_JSON_HASIL } from "@/lib/permintaan";
import { wajibLogin } from "@/lib/server/pengguna";
import { bacaJson, GalatRute, rute, wajibUuid } from "@/lib/server/respons";
import { galatSesi, migrasiBelumDijalankan, validasiHasil } from "@/lib/sesiAnalisis";
import { klienAdmin } from "@/lib/supabase/admin";

const PESAN_GAGAL_SIMPAN =
  "Riwayat latihan gagal disimpan. Skor tetap ditampilkan, tetapi tidak tercatat di riwayat.";

export const POST = rute(async (req: Request, ctx: RouteContext<"/api/sesi/[id]/hasil">) => {
  const { uid } = await wajibLogin();
  const sesiId = wajibUuid((await ctx.params).id, "ID sesi");

  const hasil = validasiHasil(await bacaJson(req, BATAS_JSON_HASIL));
  if (!hasil.sah) throw new GalatRute(400, hasil.pesan, "permintaan_tidak_valid");
  const { skor, kontur, acuan, nadaMeleset } = hasil.data;

  // Riwayat disimpan dan sesi ditandai selesai dalam satu transaksi.
  const { data, error } = await klienAdmin().rpc("selesaikan_sesi", {
    p_user: uid,
    p_sesi: sesiId,
    p_skor: skor,
    p_kontur: { titik: kontur, acuan },
    p_nada: nadaMeleset,
  } as never);
  if (error) {
    if (migrasiBelumDijalankan(error)) {
      console.error("[sesi] fungsi selesaikan_sesi belum dibuat (jalankan migrasi-02-keamanan-sesi.sql)");
    }
    const dikenal = galatSesi(error);
    if (dikenal) throw new GalatRute(dikenal.status, dikenal.pesan, dikenal.kode);
    console.error("[riwayat] gagal menyimpan", error.code, error.message);
    throw new GalatRute(500, PESAN_GAGAL_SIMPAN, "riwayat_gagal");
  }

  return Response.json({ riwayatId: data as string });
});
