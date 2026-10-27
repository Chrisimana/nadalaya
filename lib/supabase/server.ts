import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { envSupabase, OPSI_COOKIE } from "./env";

export async function buatKlienServer() {
  const { url, kunci } = envSupabase();
  const simpanan = await cookies();

  return createServerClient(url, kunci, {
    cookieOptions: OPSI_COOKIE,
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
