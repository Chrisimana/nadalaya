import { KOLOM_MATERI, keMateri, type BarisMateri } from "@/lib/server/materi";
import { kePengguna, sisaKuotaHariIni, wajibLogin } from "@/lib/server/pengguna";
import { rute } from "@/lib/server/respons";
import { klienAdmin } from "@/lib/supabase/admin";
import type { RingkasanDashboard } from "@/lib/types";

type BarisTerakhir = {
  skor: number;
  created_at: string;
  materi_latihan: BarisMateri | null;
};

export const GET = rute(async () => {
  const { uid, profil, paket } = await wajibLogin();

  const [sisaKuota, terakhir] = await Promise.all([
    sisaKuotaHariIni(uid, paket),
    klienAdmin()
      .from("riwayat_latihan")
      .select(`skor, created_at, materi_latihan(${KOLOM_MATERI})`)
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (terakhir.error) throw terakhir.error;

  const baris = terakhir.data as unknown as BarisTerakhir | null;
  const materi = baris?.materi_latihan ?? null;

  const ringkasan: RingkasanDashboard = {
    pengguna: kePengguna(profil),
    sisaKuota,
    materiTerakhir: materi?.is_aktif ? keMateri(materi, paket) : null,
    skorTerbaru: baris
      ? {
          skor: baris.skor,
          judulMateri: materi?.judul ?? "Materi dihapus",
          tanggal: baris.created_at,
        }
      : null,
  };
  return Response.json(ringkasan);
});
