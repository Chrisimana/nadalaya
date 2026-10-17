import { KOLOM_MATERI, keMateri, type BarisMateri } from "@/lib/server/materi";
import { wajibLogin } from "@/lib/server/pengguna";
import { rute } from "@/lib/server/respons";

/** UC-06 Melihat Daftar Materi: hanya materi aktif, premium ditandai terkunci. */
export const GET = rute(async () => {
  const konteks = await wajibLogin();
  // Memakai klien pengguna: RLS hanya mengizinkan materi aktif.
  const { data, error } = await konteks.supabase
    .from("materi_latihan")
    .select(KOLOM_MATERI)
    .eq("is_aktif", true)
    .order("jenis")
    .order("tingkat")
    .order("judul");
  if (error) throw error;

  const materi = (data as BarisMateri[]).map((m) => keMateri(m, konteks.paket));
  return Response.json({ materi });
});
