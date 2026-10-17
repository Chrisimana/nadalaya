import { galatAuth } from "@/lib/server/galat-auth";
import { alamatSitus, bacaJson, GalatRute, rute, teks } from "@/lib/server/respons";
import { buatKlienServer } from "@/lib/supabase/server";
import { adaGalat, validasiRegistrasi } from "@/lib/validasi";

const PESAN_TERDAFTAR = "Email sudah terdaftar. Silakan masuk atau gunakan email lain.";

/** UC-01 Mendaftar Akun. Profil Gratis dibuat oleh trigger handle_new_user. */
export const POST = rute(async (req: Request) => {
  const isi = await bacaJson(req);
  const data = {
    nama: teks(isi.nama).trim(),
    email: teks(isi.email).trim().toLowerCase(),
    kataSandi: teks(isi.kataSandi),
  };
  const galat = validasiRegistrasi(data);
  if (adaGalat(galat)) {
    throw new GalatRute(400, Object.values(galat)[0] ?? "Data tidak valid.", "data_tidak_valid");
  }

  const supabase = await buatKlienServer();
  const { data: hasil, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.kataSandi,
    options: {
      data: { nama: data.nama },
      emailRedirectTo: `${alamatSitus(req)}/auth/konfirmasi?next=/dashboard`,
    },
  });
  if (error) throw galatAuth(error);

  // Bila verifikasi email aktif, Supabase tidak memberi galat untuk email yang
  // sudah terdaftar, tetapi mengembalikan pengguna tanpa identitas.
  if (hasil.user && hasil.user.identities?.length === 0) {
    throw new GalatRute(409, PESAN_TERDAFTAR, "email_terdaftar");
  }

  return Response.json({ perluVerifikasi: !hasil.session });
});
