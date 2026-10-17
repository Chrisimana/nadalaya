import { sisaKuotaHariIni, wajibLogin } from "@/lib/server/pengguna";
import { rute } from "@/lib/server/respons";
import { resetKuotaBerikutnya } from "@/lib/waktu";

/** Status paket efektif (SDD 3.2.4) dan sisa kuota analisis hari ini. */
export const GET = rute(async () => {
  const { uid, profil, paket } = await wajibLogin();
  return Response.json({
    statusPaket: paket,
    tanggalBerakhir: paket === "gratis" ? null : profil.tanggal_berakhir,
    ujiCobaDigunakan: profil.uji_coba_digunakan,
    sisaKuota: await sisaKuotaHariIni(uid, paket),
    waktuReset: resetKuotaBerikutnya().toISOString(),
  });
});
