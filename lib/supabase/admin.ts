import "server-only";

import { createClient } from "@supabase/supabase-js";
import { envSupabase } from "./env";

let klien: ReturnType<typeof createClient> | null = null;

export function klienAdmin() {
  if (klien) return klien;
  const { url } = envSupabase();
  const rahasia = process.env.SUPABASE_SECRET_KEY;
  if (!rahasia) throw new Error("SUPABASE_SECRET_KEY belum diisi di .env.local.");
  klien = createClient(url, rahasia, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return klien;
}
