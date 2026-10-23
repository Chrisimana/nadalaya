import { rute } from "@/lib/server/respons";
import { buatKlienServer } from "@/lib/supabase/server";

export const POST = rute(async () => {
  const supabase = await buatKlienServer();
  await supabase.auth.signOut();
  return Response.json({ ok: true });
});
