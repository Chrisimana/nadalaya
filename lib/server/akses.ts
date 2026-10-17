import "server-only";

import type { HasilCekAkses } from "@/lib/types";
import { resetKuotaBerikutnya } from "@/lib/waktu";
import type { BarisMateri } from "./materi";
import { sisaKuotaHariIni, type KonteksPengguna } from "./pengguna";

/**
 * UC-09 Memeriksa Hak Akses dan Kuota (FR-08, FR-09, SDD 3.2.5).
 * Materi premium ditolak untuk pengguna Gratis; kuota habis bila sudah ada
 * 3 sesi berstatus selesai sejak 00.00 WIB.
 */
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
