import { wajibAdmin } from "@/lib/server/admin";
import { ambilProfil } from "@/lib/server/pengguna";
import { GalatRute, rute, wajibUuid } from "@/lib/server/respons";
import { klienAdmin } from "@/lib/supabase/admin";

export const POST = rute(async (_req: Request, ctx: RouteContext<"/api/admin/pengguna/[id]/aktifkan">) => {
  await wajibAdmin();
  const id = wajibUuid((await ctx.params).id, "ID pengguna");
  if (!(await ambilProfil(id))) {
    throw new GalatRute(404, "Pengguna tidak ditemukan.", "pengguna_tidak_ditemukan");
  }

  const admin = klienAdmin();
  const { error: galatBlokir } = await admin.auth.admin.updateUserById(id, { ban_duration: "none" });
  if (galatBlokir) {
    console.error("[admin] gagal membuka blokir", galatBlokir);
    throw new GalatRute(502, "Akun gagal diaktifkan kembali. Silakan coba lagi.", "aktifkan_gagal");
  }
  const { error } = await admin.from("users").update({ is_aktif: true } as never).eq("id", id);
  if (error) throw error;

  return Response.json({ ok: true });
});
