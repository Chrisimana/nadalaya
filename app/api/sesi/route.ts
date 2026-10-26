import { wajibLogin } from "@/lib/server/pengguna";
import { bacaJson, GalatRute, rute, wajibUuid } from "@/lib/server/respons";
import { galatSesi, migrasiBelumDijalankan } from "@/lib/sesiAnalisis";
import { klienAdmin } from "@/lib/supabase/admin";
import type { HasilCekAkses } from "@/lib/types";
import { resetKuotaBerikutnya } from "@/lib/waktu";

export const POST = rute(async (req: Request) => {
  const { uid } = await wajibLogin();
  const isi = await bacaJson(req);
  const materiId = wajibUuid(isi.materiId, "ID materi");

  // Hak akses, kuota, dan pembuatan sesi diperiksa atomik di database.
  const { data, error } = await klienAdmin().rpc("mulai_sesi", { p_user: uid, p_materi: materiId } as never);
  if (error) {
    if (error.message === "kuota_habis" || error.message === "materi_premium") {
      const ditolak: HasilCekAkses =
        error.message === "kuota_habis"
          ? { diizinkan: false, alasan: "kuota_habis", waktuReset: resetKuotaBerikutnya().toISOString() }
          : { diizinkan: false, alasan: "materi_premium" };
      return Response.json({ ditolak });
    }
    if (migrasiBelumDijalankan(error)) {
      console.error("[sesi] fungsi mulai_sesi belum dibuat (jalankan migrasi-02-keamanan-sesi.sql)");
    }
    const dikenal = galatSesi(error);
    if (dikenal) throw new GalatRute(dikenal.status, dikenal.pesan, dikenal.kode);
    throw error;
  }

  return Response.json({ sesiId: data as string });
});
