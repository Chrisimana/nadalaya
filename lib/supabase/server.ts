import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { envSupabase } from "./env";

export async function buatKlienServer() {
  const { url, kunci } = envSupabase();
  const simpanan = await cookies();

  return createServerClient(url, kunci, {
    cookies: {
      getAll: () => simpanan.getAll(),
      setAll(daftar) {
        try {
          daftar.forEach(({ name, value, options }) => simpanan.set(name, value, options));
        } catch {
          // Dipanggil dari Server Component yang tidak boleh menulis cookie.
        }
      },
    },
  });
}
