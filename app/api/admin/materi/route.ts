import { bersihkanCari, JENIS_SAH, keTingkat, wajibAdmin } from "@/lib/server/admin";
import {
  bacaFormMateri,
  hapusBerkasMidi,
  KOLOM_MATERI_ADMIN,
  keMateriAdmin,
  unggahMidi,
  type BarisMateriAdmin,
} from "@/lib/server/materi-admin";
import { rute } from "@/lib/server/respons";
import { klienAdmin } from "@/lib/supabase/admin";
import type { JenisMateri } from "@/lib/types";

/**
 * UC-20 Melihat Data Materi: semua materi termasuk yang nonaktif.
 * Parameter opsional: cari (judul), jenis, tingkat.
 */
export const GET = rute(async (req: Request) => {
  await wajibAdmin();
  const param = new URL(req.url).searchParams;

  let kueri = klienAdmin().from("materi_latihan").select(KOLOM_MATERI_ADMIN);
  const cari = bersihkanCari(param.get("cari"));
  if (cari) kueri = kueri.ilike("judul", `%${cari}%`);
  const jenis = param.get("jenis") as JenisMateri | null;
  if (jenis && JENIS_SAH.includes(jenis)) kueri = kueri.eq("jenis", jenis);
  const tingkat = keTingkat(param.get("tingkat"));
  if (tingkat !== null) kueri = kueri.eq("tingkat", tingkat);

  const { data, error } = await kueri.order("jenis").order("tingkat").order("judul");
  if (error) throw error;
  return Response.json({ materi: (data as unknown as BarisMateriAdmin[]).map(keMateriAdmin) });
});

/** UC-21 Menambahkan Data Materi (multipart/form-data). */
export const POST = rute(async (req: Request) => {
  await wajibAdmin();
  const { data, berkas } = await bacaFormMateri(req, true);

  const midiPath = await unggahMidi(data.judul, berkas!);
  const { data: baru, error } = await klienAdmin()
    .from("materi_latihan")
    .insert({ ...data, midi_path: midiPath } as never)
    .select(KOLOM_MATERI_ADMIN)
    .single();
  if (error) {
    // Data gagal disimpan: berkas yang baru diunggah dihapus kembali.
    await hapusBerkasMidi(midiPath);
    throw error;
  }

  return Response.json({ materi: keMateriAdmin(baru as unknown as BarisMateriAdmin) }, { status: 201 });
});
