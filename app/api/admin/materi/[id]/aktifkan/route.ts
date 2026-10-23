import { wajibAdmin } from "@/lib/server/admin";
import { GalatRute, rute, wajibUuid } from "@/lib/server/respons";
import { klienAdmin } from "@/lib/supabase/admin";

/** Mengaktifkan kembali materi yang nonaktif. */
export const PATCH = rute(async (_req: Request, ctx: RouteContext<"/api/admin/materi/[id]/aktifkan">) => {
  await wajibAdmin();
  const id = wajibUuid((await ctx.params).id, "ID materi");

  const { data, error } = await klienAdmin()
    .from("materi_latihan")
    .update({ is_aktif: true } as never)
    .eq("id", id)
    .select("id");
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new GalatRute(404, "Materi tidak ditemukan.", "materi_tidak_ditemukan");
  }
  return Response.json({ ok: true });
});
