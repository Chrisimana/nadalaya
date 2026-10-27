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
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${alamatSitus()}/auth/konfirmasi?next=/atur-ulang-kata-sandi`,
  });
  if (error?.status === 429) throw galatAuth(error);
  if (error) console.error("[auth] lupa sandi", error.code, error.message);

  return Response.json({ ok: true });
});
