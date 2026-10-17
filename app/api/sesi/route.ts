import { periksaAkses } from "@/lib/server/akses";
import { ambilMateriAktif } from "@/lib/server/materi";
import { wajibLogin } from "@/lib/server/pengguna";
import { bacaJson, rute, wajibUuid } from "@/lib/server/respons";
import { klienAdmin } from "@/lib/supabase/admin";

/**
 * Dipanggil setiap kali tombol Analisis ditekan (SDD 3.2.5): periksa ulang
 * hak akses dan kuota, lalu catat sesi_analisis berstatus "dimulai".
 */
export const POST = rute(async (req: Request) => {
  const konteks = await wajibLogin();
  const isi = await bacaJson(req);
  const materiId = wajibUuid(isi.materiId, "ID materi");

  const materi = await ambilMateriAktif(materiId);
  const akses = await periksaAkses(konteks, materi);
  if (!akses.diizinkan) return Response.json({ ditolak: akses });

  const { data, error } = await klienAdmin()
    .from("sesi_analisis")
    .insert({ user_id: konteks.uid, materi_id: materiId, status: "dimulai" } as never)
    .select("id")
    .single();
  if (error) throw error;

  return Response.json({ sesiId: (data as { id: string }).id });
});
