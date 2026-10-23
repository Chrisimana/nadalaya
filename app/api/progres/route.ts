import { wajibLogin, wajibPremium } from "@/lib/server/pengguna";
import { rute } from "@/lib/server/respons";
import { klienAdmin } from "@/lib/supabase/admin";
import type { JenisMateri, TitikProgres } from "@/lib/types";

type BarisProgres = {
  skor: number;
  created_at: string;
  materi_latihan: { jenis: JenisMateri } | null;
};

export const GET = rute(async () => {
  const konteks = await wajibLogin();
  wajibPremium(konteks);

  const { data, error } = await klienAdmin()
    .from("riwayat_latihan")
    .select("skor, created_at, materi_latihan(jenis)")
    .eq("user_id", konteks.uid)
    .order("created_at", { ascending: true })
    .limit(500);
  if (error) throw error;

  const progres: TitikProgres[] = (data as unknown as BarisProgres[])
    .filter((b) => b.materi_latihan)
    .map((b) => ({ tanggal: b.created_at, jenis: b.materi_latihan!.jenis, skor: b.skor }));
  return Response.json({ progres });
});
