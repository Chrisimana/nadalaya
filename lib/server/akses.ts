import "server-only";

import type { HasilCekAkses } from "@/lib/types";
import { resetKuotaBerikutnya } from "@/lib/waktu";
import type { BarisMateri } from "./materi";
import { sisaKuotaHariIni, type KonteksPengguna } from "./pengguna";

export async function periksaAkses(
  konteks: KonteksPengguna,
  materi: BarisMateri,
): Promise<HasilCekAkses> {
  if (materi.is_premium && konteks.paket === "gratis") {
    return { diizinkan: false, alasan: "materi_premium" };
  }
  const sisaKuota = await sisaKuotaHariIni(konteks.uid, konteks.paket);
  if (sisaKuota === 0) {
    return {
      diizinkan: false,
      alasan: "kuota_habis",
      waktuReset: resetKuotaBerikutnya().toISOString(),
    };
  }
  return { diizinkan: true, sisaKuota };
}
