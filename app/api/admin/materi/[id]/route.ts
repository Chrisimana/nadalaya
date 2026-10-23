import { hitung, wajibAdmin } from "@/lib/server/admin";
import {
  bacaFormMateri,
  hapusBerkasMidi,
  KOLOM_MATERI_ADMIN,
  keMateriAdmin,
  unggahMidi,
  type BarisMateriAdmin,
} from "@/lib/server/materi-admin";
import { GalatRute, rute, wajibUuid } from "@/lib/server/respons";
import { klienAdmin } from "@/lib/supabase/admin";

type Konteks = RouteContext<"/api/admin/materi/[id]">;

async function ambilMateri(id: string) {
  const { data, error } = await klienAdmin()
    .from("materi_latihan")
    .select(KOLOM_MATERI_ADMIN)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new GalatRute(404, "Materi tidak ditemukan.", "materi_tidak_ditemukan");
  return data as unknown as BarisMateriAdmin;
}

export const GET = rute(async (_req: Request, ctx: Konteks) => {
  await wajibAdmin();
  const id = wajibUuid((await ctx.params).id, "ID materi");
  return Response.json({ materi: keMateriAdmin(await ambilMateri(id)) });
});

export const PATCH = rute(async (req: Request, ctx: Konteks) => {
  await wajibAdmin();
  const id = wajibUuid((await ctx.params).id, "ID materi");
  const lama = await ambilMateri(id);
  const { data, berkas } = await bacaFormMateri(req, false);

  const pathBaru = berkas ? await unggahMidi(data.judul, berkas) : null;
  const { data: hasil, error } = await klienAdmin()
    .from("materi_latihan")
    .update({ ...data, ...(pathBaru ? { midi_path: pathBaru } : {}) } as never)
    .eq("id", id)
    .select(KOLOM_MATERI_ADMIN)
    .single();
  if (error) {
    if (pathBaru) await hapusBerkasMidi(pathBaru);
    throw error;
  }
  if (pathBaru && lama.midi_path !== pathBaru) await hapusBerkasMidi(lama.midi_path);

  return Response.json({ materi: keMateriAdmin(hasil as unknown as BarisMateriAdmin) });
});

export const DELETE = rute(async (_req: Request, ctx: Konteks) => {
  await wajibAdmin();
  const id = wajibUuid((await ctx.params).id, "ID materi");
  const materi = await ambilMateri(id);
  const admin = klienAdmin();

  const nonaktifkan = async () => {
    const { error } = await admin.from("materi_latihan").update({ is_aktif: false } as never).eq("id", id);
    if (error) throw error;
    return Response.json({ dinonaktifkan: true });
  };

  const [jumlahSesi, jumlahRiwayat] = await Promise.all([
    hitung("sesi_analisis", { materi_id: id }),
    hitung("riwayat_latihan", { materi_id: id }),
  ]);
  if (jumlahSesi + jumlahRiwayat > 0) return nonaktifkan();

  const { error } = await admin.from("materi_latihan").delete().eq("id", id);
  if (error) {
    if ((error as { code?: string }).code === "23503") return nonaktifkan();
    throw error;
  }
  await hapusBerkasMidi(materi.midi_path);
  return Response.json({ dinonaktifkan: false });
});
