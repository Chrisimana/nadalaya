export function envSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const kunci = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !kunci) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY belum diisi di .env.local.",
    );
  }
  return { url, kunci };
}

/** Sesi hanya dibaca server, jadi cookie tidak perlu terbaca JavaScript. */
export const OPSI_COOKIE = {
  httpOnly: true,
  sameSite: "lax",
  // Secure hanya di produksi HTTPS; Docker lokal tetap berjalan di http://localhost.
  secure:
    process.env.NODE_ENV === "production" &&
    (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://"),
} as const;
