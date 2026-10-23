import { wajibAdmin } from "@/lib/server/admin";
import {
  KOLOM_PENGGUNA_ADMIN,
  kePenggunaAdmin,
  type BarisPenggunaAdmin,
} from "@/lib/server/pengguna-admin";
import { GalatRute, rute, wajibUuid } from "@/lib/server/respons";
import { KOLOM_RIWAYAT, keItemRiwayat, type BarisRiwayat } from "@/lib/server/riwayat";
import { klienAdmin } from "@/lib/supabase/admin";
import type { DetailPenggunaAdmin } from "@/lib/types";

export const GET = rute(async (_req: Request, ctx: RouteContext<"/api/admin/pengguna/[id]">) => {
  await wajibAdmin();
  const id = wajibUuid((await ctx.params).id, "ID pengguna");
  const admin = klienAdmin();

  const [profil, latihan] = await Promise.all([
    admin.from("users").select(KOLOM_PENGGUNA_ADMIN).eq("id", id).maybeSingle(),
    admin
      .from("riwayat_latihan")
      .select(KOLOM_RIWAYAT)
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);
  if (profil.error) throw profil.error;
  if (latihan.error) throw latihan.error;
  if (!profil.data) throw new GalatRute(404, "Pengguna tidak ditemukan.", "pengguna_tidak_ditemukan");

  const [pengguna] = await kePenggunaAdmin([profil.data as unknown as BarisPenggunaAdmin]);
  const detail: DetailPenggunaAdmin = {
    ...pengguna,
    latihanTerakhir: (latihan.data as unknown as BarisRiwayat[]).map(keItemRiwayat),
  };
  return Response.json({ pengguna: detail });
});
