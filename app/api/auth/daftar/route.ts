import { alamatSitus } from "@/lib/keamanan";
import { batasi, PEMBATAS } from "@/lib/pembatas";
import { ipKlien } from "@/lib/permintaan";
import { galatAuth, PESAN_EMAIL_DIGUNAKAN } from "@/lib/server/galat-auth";
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

  batasi([
    [PEMBATAS.daftarIp, ipKlien(req.headers)],
    [PEMBATAS.daftarEmail, data.email],
  ]);

  const supabase = await buatKlienServer();
  const { data: hasil, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.kataSandi,
    options: {
      data: { nama: data.nama },
      emailRedirectTo: `${alamatSitus()}/auth/konfirmasi?next=/dashboard`,
    },
  });

  if (error) throw galatAuth(error);
  // Supabase mengembalikan pengguna tanpa identitas bila email sudah terdaftar dan terverifikasi.
  // Pengguna diberi tahu terus terang agar tidak menunggu email verifikasi yang tidak akan dikirim.
  if (hasil.user && hasil.user.identities?.length === 0) {
    throw new GalatRute(409, PESAN_EMAIL_DIGUNAKAN, "email_terdaftar");
  }

  return Response.json({ perluVerifikasi: !hasil.session });
});
