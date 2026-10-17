import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { envSupabase } from "@/lib/supabase/env";

// Next.js 16: middleware.ts berganti nama menjadi proxy.ts (fungsinya sama).

/** Halaman grup (pengguna): wajib masuk. */
const AWALAN_PENGGUNA = ["/dashboard", "/materi", "/latihan", "/riwayat", "/progres", "/langganan", "/profil"];
/** Halaman yang tidak perlu dibuka lagi setelah masuk. */
const HALAMAN_TAMU = ["/masuk", "/daftar"];

function cocok(jalur: string, awalan: string) {
  return jalur === awalan || jalur.startsWith(`${awalan}/`);
}

export async function proxy(request: NextRequest) {
  let respons = NextResponse.next({ request });
  const { url, kunci } = envSupabase();

  // Menyegarkan token sesi dan menyalinnya ke request dan response.
  const supabase = createServerClient(url, kunci, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(daftar, header) {
        daftar.forEach(({ name, value }) => request.cookies.set(name, value));
        respons = NextResponse.next({ request });
        daftar.forEach(({ name, value, options }) => respons.cookies.set(name, value, options));
        Object.entries(header ?? {}).forEach(([k, v]) => respons.headers.set(k, v));
      },
    },
  });

  const jalur = request.nextUrl.pathname;
  const halamanAdmin = cocok(jalur, "/admin");
  const halamanPengguna = AWALAN_PENGGUNA.some((a) => cocok(jalur, a));
  const halamanTamu = HALAMAN_TAMU.includes(jalur);

  // getClaims memverifikasi JWT; wajib dipanggil agar sesi tetap segar.
  const { data } = await supabase.auth.getClaims();
  const uid = data?.claims?.sub;

  /** Pengalihan yang tetap membawa cookie sesi yang baru disegarkan. */
  const alihkan = (tujuan: string, lanjut?: boolean) => {
    const alamat = new URL(tujuan, request.url);
    if (lanjut) alamat.searchParams.set("lanjut", jalur + request.nextUrl.search);
    const pengalihan = NextResponse.redirect(alamat);
    respons.cookies.getAll().forEach((c) => pengalihan.cookies.set(c));
    return pengalihan;
  };

  if (!halamanAdmin && !halamanPengguna && !halamanTamu) return respons;

  if (!uid) {
    return halamanTamu ? respons : alihkan("/masuk", true);
  }

  // Peran dan status akun dibaca dari tabel users (RLS: profil sendiri).
  const { data: profil } = await supabase
    .from("users")
    .select("peran, is_aktif")
    .eq("id", uid)
    .maybeSingle<{ peran: "pengguna" | "admin"; is_aktif: boolean }>();

  if (!profil || !profil.is_aktif) {
    await supabase.auth.signOut();
    if (halamanTamu && !profil) return respons;
    return alihkan(profil ? "/masuk?galat=nonaktif" : "/masuk");
  }

  if (halamanTamu) return alihkan(profil.peran === "admin" ? "/admin" : "/dashboard");
  if (halamanAdmin && profil.peran !== "admin") return alihkan("/dashboard");

  return respons;
}

export const config = {
  matcher: [
    // Lewati API (memvalidasi sesi sendiri), tautan email, aset statis, dan berkas.
    "/((?!api|auth|models|_next/static|_next/image|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mid)$).*)",
  ],
};
