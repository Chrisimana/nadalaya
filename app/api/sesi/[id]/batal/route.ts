import { wajibLogin } from "@/lib/server/pengguna";
import { rute, wajibUuid } from "@/lib/server/respons";
import { klienAdmin } from "@/lib/supabase/admin";

/**
 * Menandai sesi batal (rekaman kurang dari 2 detik, tanpa suara, atau model
 * gagal dimuat). Sesi batal tidak dihitung sebagai kuota.
 */
export const POST = rute(async (_req: Request, ctx: RouteContext<"/api/sesi/[id]/batal">) => {
  const konteks = await wajibLogin();
  const sesiId = wajibUuid((await ctx.params).id, "ID sesi");

  // Hanya sesi milik sendiri yang masih "dimulai" yang dapat dibatalkan.
  const { error } = await klienAdmin()
    .from("sesi_analisis")
    .update({ status: "batal" } as never)
    .eq("id", sesiId)
    .eq("user_id", konteks.uid)
    .eq("status", "dimulai");
  if (error) throw error;

  return Response.json({ ok: true });
});
