import { alamatSitus } from "@/lib/keamanan";
import { galatAuth } from "@/lib/server/galat-auth";
import { bacaJson, GalatRute, rute, teks } from "@/lib/server/respons";
import { buatKlienServer } from "@/lib/supabase/server";
import { adaGalat, validasiRegistrasi } from "@/lib/validasi";

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
      emailRedirectTo: `${alamatSitus()}/auth/konfirmasi?next=/dashboard`,
    },
  });

  // Email yang sudah terdaftar dijawab sama seperti pendaftaran baru agar tidak bisa ditebak.
  if (error) {
    const terjemahan = galatAuth(error);
    if (terjemahan.kode === "email_terdaftar") return Response.json({ perluVerifikasi: true });
    throw terjemahan;
  }
  if (hasil.user && hasil.user.identities?.length === 0) {
    return Response.json({ perluVerifikasi: true });
  }

  return Response.json({ perluVerifikasi: !hasil.session });
});
