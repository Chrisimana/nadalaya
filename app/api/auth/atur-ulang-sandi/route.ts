import { sesiPemulihan } from "@/lib/keamanan";
import { galatAuth } from "@/lib/server/galat-auth";
import { ambilProfil, PESAN_NONAKTIF } from "@/lib/server/pengguna";
import { bacaJson, GalatRute, rute, teks } from "@/lib/server/respons";
import { buatKlienServer } from "@/lib/supabase/server";
import { validasiKataSandiBaru } from "@/lib/validasi";

const PESAN_KEDALUWARSA = "Tautan atur ulang kata sandi sudah tidak berlaku.";

export const POST = rute(async (req: Request) => {
  const isi = await bacaJson(req);
  const kataSandi = teks(isi.kataSandi);
  const galat = validasiKataSandiBaru(kataSandi);
  if (galat) throw new GalatRute(400, galat, "data_tidak_valid");

  const supabase = await buatKlienServer();
  const { data } = await supabase.auth.getClaims();
  const klaim = data?.claims;
  // Hanya sesi dari tautan email yang masih baru, bukan sesi login dengan kata sandi.
  if (!klaim?.sub || !sesiPemulihan(klaim.amr)) {
    throw new GalatRute(401, PESAN_KEDALUWARSA, "tautan_kedaluwarsa");
  }

  const profil = await ambilProfil(klaim.sub);
  if (!profil?.is_aktif) {
    await supabase.auth.signOut();
    throw new GalatRute(403, PESAN_NONAKTIF, "akun_nonaktif");
  }

  const { error } = await supabase.auth.updateUser({ password: kataSandi });
  if (error) {
    const terjemahan = galatAuth(error);
    if (terjemahan.kode === "belum_masuk") {
      throw new GalatRute(401, PESAN_KEDALUWARSA, "tautan_kedaluwarsa");
    }
    throw terjemahan;
  }

  // Pengguna diminta masuk ulang dengan kata sandi baru.
  await supabase.auth.signOut();
  return Response.json({ ok: true });
});
