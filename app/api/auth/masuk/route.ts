import { galatAuth } from "@/lib/server/galat-auth";
import { ambilProfil, kePengguna, PESAN_NONAKTIF, segarkanPaket } from "@/lib/server/pengguna";
import { bacaJson, GalatRute, rute, teks } from "@/lib/server/respons";
import { buatKlienServer } from "@/lib/supabase/server";
import { adaGalat, validasiMasuk } from "@/lib/validasi";

/** UC-02 Masuk ke Sistem (SDD 3.2.7). */
export const POST = rute(async (req: Request) => {
  const isi = await bacaJson(req);
  const data = { email: teks(isi.email).trim().toLowerCase(), kataSandi: teks(isi.kataSandi) };
  const galat = validasiMasuk(data);
  if (adaGalat(galat)) {
    throw new GalatRute(400, Object.values(galat)[0] ?? "Data tidak valid.", "data_tidak_valid");
  }

  const supabase = await buatKlienServer();
  const { data: hasil, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.kataSandi,
  });
  if (error) throw galatAuth(error);

  // Setelah autentikasi, baca peran dan is_aktif dari tabel users.
  const profil = await ambilProfil(hasil.user.id);
  if (!profil) {
    await supabase.auth.signOut();
    throw new GalatRute(500, "Profil akun tidak ditemukan. Hubungi admin Nadalaya.", "profil_hilang");
  }
  if (!profil.is_aktif) {
    await supabase.auth.signOut();
    throw new GalatRute(403, PESAN_NONAKTIF, "akun_nonaktif");
  }

  return Response.json({ pengguna: kePengguna(await segarkanPaket(profil)) });
});
