import { ringkasGalat } from "@/lib/permintaan";
import { wajibAdmin } from "@/lib/server/admin";
import { ambilProfil } from "@/lib/server/pengguna";
import { GalatRute, rute, wajibUuid } from "@/lib/server/respons";
import { klienAdmin } from "@/lib/supabase/admin";

const DURASI_BLOKIR = "876000h";

export const POST = rute(async (_req: Request, ctx: RouteContext<"/api/admin/pengguna/[id]/nonaktifkan">) => {
  const { uid } = await wajibAdmin();
  const id = wajibUuid((await ctx.params).id, "ID pengguna");

  if (id === uid) {
    throw new GalatRute(400, "Anda tidak dapat menonaktifkan akun Anda sendiri.", "aksi_ditolak");
  }
  const target = await ambilProfil(id);
  if (!target) throw new GalatRute(404, "Pengguna tidak ditemukan.", "pengguna_tidak_ditemukan");
  if (target.peran === "admin") {
    throw new GalatRute(400, "Akun admin tidak dapat dinonaktifkan.", "aksi_ditolak");
  }

  const admin = klienAdmin();
  const { error } = await admin.from("users").update({ is_aktif: false } as never).eq("id", id);
  if (error) throw error;

  const { error: galatBlokir } = await admin.auth.admin.updateUserById(id, { ban_duration: DURASI_BLOKIR });
  if (galatBlokir) {
    // Kembalikan agar status di aplikasi dan di Auth tetap konsisten.
    await admin.from("users").update({ is_aktif: true } as never).eq("id", id);
    console.error("[admin] gagal mencabut sesi", ringkasGalat(galatBlokir));
    throw new GalatRute(502, "Sesi pengguna gagal dicabut. Akun belum dinonaktifkan.", "cabut_sesi_gagal");
  }

  return Response.json({ ok: true });
});
