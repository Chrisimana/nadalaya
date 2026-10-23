import { ambilSemua, daftarTanggal, rentangWib, tanggalWib, wajibAdmin } from "@/lib/server/admin";
import { rute } from "@/lib/server/respons";
import { klienAdmin } from "@/lib/supabase/admin";
import type { StatistikLatihan } from "@/lib/types";

type BarisLatihan = {
  user_id: string;
  materi_id: string;
  skor: number;
  created_at: string;
  materi_latihan: { judul: string } | null;
};

/**
 * UC-26 Melihat Statistik Latihan. Rentang `dari`–`sampai` (YYYY-MM-DD, WIB),
 * bawaan 30 hari terakhir. Satu riwayat = satu sesi analisis yang selesai.
 */
export const GET = rute(async (req: Request) => {
  await wajibAdmin();
  const rentang = rentangWib(new URL(req.url).searchParams, 30);

  const latihan = await ambilSemua<BarisLatihan>((dari, sampai) =>
    klienAdmin()
      .from("riwayat_latihan")
      .select("user_id, materi_id, skor, created_at, materi_latihan(judul)")
      .gte("created_at", rentang.awal!)
      .lt("created_at", rentang.akhir!)
      .order("created_at")
      .range(dari, sampai),
  );

  const perMateri = new Map<string, { judul: string; jumlah: number }>();
  const perTanggal = new Map<string, number>();
  for (const l of latihan) {
    const m = perMateri.get(l.materi_id) ?? { judul: l.materi_latihan?.judul ?? "Materi dihapus", jumlah: 0 };
    m.jumlah++;
    perMateri.set(l.materi_id, m);
    const t = tanggalWib(l.created_at);
    perTanggal.set(t, (perTanggal.get(t) ?? 0) + 1);
  }
  const terpopuler = [...perMateri.values()].sort((a, b) => b.jumlah - a.jumlah)[0] ?? null;

  const statistik: StatistikLatihan = {
    jumlahSesi: latihan.length,
    rataRataSkor: latihan.length ? latihan.reduce((s, l) => s + l.skor, 0) / latihan.length : null,
    materiTerpopuler: terpopuler,
    penggunaAktif: new Set(latihan.map((l) => l.user_id)).size,
    perHari: latihan.length
      ? daftarTanggal(rentang.tanggalDari!, rentang.tanggalSampai!).map((tanggal) => ({
          tanggal,
          jumlah: perTanggal.get(tanggal) ?? 0,
        }))
      : [],
  };
  return Response.json(statistik);
});
