import { wajibLogin } from "@/lib/server/pengguna";
import { GalatRute, rute, wajibUuid } from "@/lib/server/respons";
import { galatSesi, migrasiBelumDijalankan } from "@/lib/sesiAnalisis";
import { klienAdmin } from "@/lib/supabase/admin";

export const POST = rute(async (_req: Request, ctx: RouteContext<"/api/sesi/[id]/batal">) => {
  const { uid } = await wajibLogin();
  const sesiId = wajibUuid((await ctx.params).id, "ID sesi");

  // Hanya sesi milik sendiri yang masih "dimulai" yang dibatalkan.
  const { data, error } = await klienAdmin().rpc("batalkan_sesi", { p_user: uid, p_sesi: sesiId } as never);
  if (error) {
    if (migrasiBelumDijalankan(error)) {
      console.error("[sesi] fungsi batalkan_sesi belum dibuat (jalankan migrasi-02-keamanan-sesi.sql)");
    }
    const dikenal = galatSesi(error);
    if (dikenal) throw new GalatRute(dikenal.status, dikenal.pesan, dikenal.kode);
    throw error;
  }

  return Response.json({ dibatalkan: data === true });
});
