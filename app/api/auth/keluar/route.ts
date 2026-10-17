import { rute } from "@/lib/server/respons";
import { buatKlienServer } from "@/lib/supabase/server";

/** UC-04 Keluar dari Sistem. */
export const POST = rute(async () => {
  const supabase = await buatKlienServer();
  await supabase.auth.signOut();
  return Response.json({ ok: true });
});
