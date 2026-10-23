import { ambilSemua, hitung, wajibAdmin } from "@/lib/server/admin";
import { rute } from "@/lib/server/respons";
import { klienAdmin } from "@/lib/supabase/admin";
import type { RingkasanAdmin } from "@/lib/types";

export const GET = rute(async () => {
  await wajibAdmin();

  const [jumlahPengguna, jumlahLatihan, berhasil] = await Promise.all([
    hitung("users", { peran: "pengguna" }),
    hitung("riwayat_latihan"),
    ambilSemua<{ nominal: number }>((dari, sampai) =>
      klienAdmin().from("transaksi").select("nominal").eq("status", "berhasil").range(dari, sampai),
    ),
  ]);

  const ringkasan: RingkasanAdmin = {
    jumlahPengguna,
    jumlahLatihan,
    transaksiBerhasil: berhasil.length,
    pendapatan: berhasil.reduce((s, t) => s + t.nominal, 0),
  };
  return Response.json(ringkasan);
});
