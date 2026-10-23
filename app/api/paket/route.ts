import { sisaKuotaHariIni, wajibLogin } from "@/lib/server/pengguna";
import { rute } from "@/lib/server/respons";
import { resetKuotaBerikutnya } from "@/lib/waktu";

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
