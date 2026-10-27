import { alamatSitus } from "@/lib/keamanan";
import { galatAuth } from "@/lib/server/galat-auth";
import { bacaJson, GalatRute, rute, teks } from "@/lib/server/respons";
import { buatKlienServer } from "@/lib/supabase/server";
import { validasiEmail } from "@/lib/validasi";

export const POST = rute(async (req: Request) => {
  const isi = await bacaJson(req);
  const email = teks(isi.email).trim().toLowerCase();
  const galat = validasiEmail(email);
  if (galat) throw new GalatRute(400, galat, "data_tidak_valid");

  const supabase = await buatKlienServer();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${alamatSitus()}/auth/konfirmasi?next=/dashboard` },
  });
  // Selain batas permintaan, galat tidak diteruskan agar status email tidak bisa ditebak.
  if (error?.status === 429) throw galatAuth(error);
  if (error) console.error("[auth] kirim ulang verifikasi", error.code, error.message);

  return Response.json({ ok: true });
});
