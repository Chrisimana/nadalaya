import { PESAN_NONAKTIF, wajibLogin } from "@/lib/server/pengguna";
import { GalatRute, rute } from "@/lib/server/respons";
import { klienAdmin } from "@/lib/supabase/admin";

const GALAT_FUNGSI: Record<string, GalatRute> = {
  uji_coba_digunakan: new GalatRute(409, "Uji coba hanya dapat digunakan satu kali.", "uji_coba_digunakan"),
  sudah_premium: new GalatRute(409, "Anda sudah berlangganan Premium.", "sudah_premium"),
  akun_nonaktif: new GalatRute(403, PESAN_NONAKTIF, "akun_nonaktif"),
  pengguna_tidak_ditemukan: new GalatRute(404, "Akun tidak ditemukan.", "pengguna_tidak_ditemukan"),
};

export const POST = rute(async () => {
  const { uid } = await wajibLogin();

  const { data, error } = await klienAdmin().rpc("aktifkan_uji_coba", { p_user: uid } as never);
  if (error) {
    const dikenal = GALAT_FUNGSI[error.message];
    if (dikenal) throw dikenal;
    if (error.code === "PGRST202" || error.code === "42883") {
      console.error("[uji-coba] fungsi aktifkan_uji_coba belum dibuat (jalankan migrasi-01-uji-coba.sql)");
      throw new GalatRute(503, "Fitur uji coba belum siap. Silakan coba lagi nanti.", "belum_siap");
    }
    throw error;
  }

  return Response.json({ tanggalBerakhir: data as string });
});
