import { wajibLogin } from "@/lib/server/pengguna";
import { bacaJson, GalatRute, rute, wajibUuid } from "@/lib/server/respons";
import { klienAdmin } from "@/lib/supabase/admin";

const PESAN_GAGAL_SIMPAN =
  "Riwayat latihan gagal disimpan. Skor tetap ditampilkan, tetapi tidak tercatat di riwayat.";

/** Batas ukuran ringkasan agar baris riwayat tetap ringan. */
const MAKS_TITIK = 3000;
const MAKS_NADA = 1000;

function angka(nilai: unknown): number | null {
  return typeof nilai === "number" && Number.isFinite(nilai) ? nilai : null;
}

/** Ambil hanya kolom angka yang dikenal dari setiap objek dalam larik. */
function bersihkan<K extends string>(
  nilai: unknown,
  kolom: readonly K[],
  maks: number,
  bolehNull: K[] = [],
): Record<K, number | null>[] {
  if (!Array.isArray(nilai) || nilai.length > maks) {
    throw new GalatRute(400, "Data hasil analisis tidak valid.", "permintaan_tidak_valid");
  }
  return nilai.map((item) => {
    const hasil = {} as Record<K, number | null>;
    for (const k of kolom) {
      const v = angka((item as Record<string, unknown> | null)?.[k]);
      if (v === null && !bolehNull.includes(k)) {
        throw new GalatRute(400, "Data hasil analisis tidak valid.", "permintaan_tidak_valid");
      }
      hasil[k] = v;
    }
    return hasil;
  });
}

/**
 * UC-13 / FR-16: simpan riwayat_latihan lalu tandai sesi selesai (dihitung
 * sebagai satu kuota). Jika penyimpanan gagal, sesi tetap "dimulai".
 * Rekaman suara tidak pernah dikirim ke server (NFR-07).
 */
export const POST = rute(async (req: Request, ctx: RouteContext<"/api/sesi/[id]/hasil">) => {
  const konteks = await wajibLogin();
  const sesiId = wajibUuid((await ctx.params).id, "ID sesi");
  const isi = await bacaJson(req);

  const skor = angka(isi.skor);
  if (skor === null || skor < 0 || skor > 100) {
    throw new GalatRute(400, "Skor tidak valid.", "permintaan_tidak_valid");
  }
  const kontur = bersihkan(isi.kontur, ["waktu", "midi"] as const, MAKS_TITIK, ["midi"]);
  const acuan = bersihkan(isi.acuan, ["midi", "waktu", "durasi"] as const, MAKS_NADA);
  const nadaMeleset = bersihkan(
    isi.nadaMeleset,
    ["urutan", "midiAcuan", "selisihCent", "waktu"] as const,
    MAKS_NADA,
  );

  const admin = klienAdmin();
  const { data: sesi, error: galatSesi } = await admin
    .from("sesi_analisis")
    .select("id, materi_id, status")
    .eq("id", sesiId)
    .eq("user_id", konteks.uid)
    .maybeSingle();
  if (galatSesi) throw galatSesi;
  if (!sesi) throw new GalatRute(404, "Sesi analisis tidak ditemukan.", "sesi_tidak_ditemukan");
  const { materi_id, status } = sesi as { materi_id: string; status: string };
  if (status !== "dimulai") {
    throw new GalatRute(409, "Sesi analisis ini sudah selesai atau dibatalkan.", "sesi_tidak_aktif");
  }

  const { data: riwayat, error: galatSimpan } = await admin
    .from("riwayat_latihan")
    .insert({
      user_id: konteks.uid,
      materi_id,
      sesi_id: sesiId,
      skor: Math.round(skor),
      kontur_pitch: { titik: kontur, acuan },
      nada_meleset: nadaMeleset,
    } as never)
    .select("id")
    .single();
  if (galatSimpan) {
    console.error("[riwayat] gagal menyimpan", galatSimpan);
    throw new GalatRute(500, PESAN_GAGAL_SIMPAN, "riwayat_gagal");
  }
  const riwayatId = (riwayat as { id: string }).id;

  const { error: galatSelesai } = await admin
    .from("sesi_analisis")
    .update({ status: "selesai" } as never)
    .eq("id", sesiId);
  if (galatSelesai) {
    // Kembalikan ke keadaan semula agar riwayat dan kuota tetap konsisten.
    console.error("[riwayat] gagal menandai sesi selesai", galatSelesai);
    await admin.from("riwayat_latihan").delete().eq("id", riwayatId);
    throw new GalatRute(500, PESAN_GAGAL_SIMPAN, "riwayat_gagal");
  }

  return Response.json({ riwayatId });
});
