import { galatAuth } from "@/lib/server/galat-auth";
import { bacaJson, GalatRute, rute, teks } from "@/lib/server/respons";
import { buatKlienServer } from "@/lib/supabase/server";
import { validasiKataSandiBaru } from "@/lib/validasi";

const PESAN_KEDALUWARSA = "Tautan atur ulang kata sandi sudah tidak berlaku.";

/**
 * UC-03 langkah 4: simpan kata sandi baru. Sesi pemulihan dibuat oleh
 * /auth/konfirmasi saat pengguna membuka tautan dari email.
 */
export const POST = rute(async (req: Request) => {
  const isi = await bacaJson(req);
  const kataSandi = teks(isi.kataSandi);
  const galat = validasiKataSandiBaru(kataSandi);
  if (galat) throw new GalatRute(400, galat, "data_tidak_valid");

  const supabase = await buatKlienServer();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) throw new GalatRute(401, PESAN_KEDALUWARSA, "tautan_kedaluwarsa");

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
