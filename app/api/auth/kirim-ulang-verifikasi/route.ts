import { galatAuth } from "@/lib/server/galat-auth";
import { alamatSitus, bacaJson, GalatRute, rute, teks } from "@/lib/server/respons";
import { buatKlienServer } from "@/lib/supabase/server";
import { validasiEmail } from "@/lib/validasi";

/** UC-01 langkah 3.3: kirim ulang email verifikasi. */
export const POST = rute(async (req: Request) => {
  const isi = await bacaJson(req);
  const email = teks(isi.email).trim().toLowerCase();
  const galat = validasiEmail(email);
  if (galat) throw new GalatRute(400, galat, "data_tidak_valid");

  const supabase = await buatKlienServer();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${alamatSitus(req)}/auth/konfirmasi?next=/dashboard` },
  });
  if (error) throw galatAuth(error);

  return Response.json({ ok: true });
});
