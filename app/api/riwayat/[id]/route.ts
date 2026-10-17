import { wajibLogin, wajibPremium } from "@/lib/server/pengguna";
import { GalatRute, rute, wajibUuid } from "@/lib/server/respons";
import { KOLOM_RIWAYAT, keItemRiwayat, type BarisRiwayat } from "@/lib/server/riwayat";
import { klienAdmin } from "@/lib/supabase/admin";
import type { DetailRiwayat, NadaAcuan, NadaMeleset, TitikPitch } from "@/lib/types";

type BarisDetail = BarisRiwayat & {
  kontur_pitch: { titik?: TitikPitch[]; acuan?: NadaAcuan[] } | null;
  nada_meleset: NadaMeleset[] | null;
};

/** Detail satu riwayat: skor, kontur nada, dan nada yang meleset. */
export const GET = rute(async (_req: Request, ctx: RouteContext<"/api/riwayat/[id]">) => {
  const konteks = await wajibLogin();
  wajibPremium(konteks);
  const id = wajibUuid((await ctx.params).id, "ID riwayat");

  const { data, error } = await klienAdmin()
    .from("riwayat_latihan")
    .select(`${KOLOM_RIWAYAT}, kontur_pitch, nada_meleset`)
    .eq("id", id)
    .eq("user_id", konteks.uid)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new GalatRute(404, "Riwayat latihan tidak ditemukan.", "riwayat_tidak_ditemukan");

  const baris = data as unknown as BarisDetail;
  const detail: DetailRiwayat = {
    ...keItemRiwayat(baris),
    hasil: {
      skor: baris.skor,
      kontur: baris.kontur_pitch?.titik ?? [],
      acuan: baris.kontur_pitch?.acuan ?? [],
      nadaMeleset: baris.nada_meleset ?? [],
    },
  };
  return Response.json({ riwayat: detail });
});
