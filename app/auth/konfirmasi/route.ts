import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { jalurInternal } from "@/lib/keamanan";
import { ambilProfil } from "@/lib/server/pengguna";
import { buatKlienServer } from "@/lib/supabase/server";

const JENIS_OTP: EmailOtpType[] = ["signup", "invite", "magiclink", "recovery", "email_change", "email"];
const HALAMAN_ATUR_ULANG = "/atur-ulang-kata-sandi";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const tujuan = jalurInternal(searchParams.get("next"));
  const jenis = searchParams.get("type");
  const pemulihan = tujuan === HALAMAN_ATUR_ULANG || jenis === "recovery";
  const alihkan = (jalur: string) => NextResponse.redirect(new URL(jalur, origin));
  const gagal = () =>
    alihkan(pemulihan ? `${HALAMAN_ATUR_ULANG}?galat=kedaluwarsa` : "/masuk?verifikasi=gagal");

  // Supabase menambahkan error_code (mis. otp_expired) bila tautan tidak berlaku.
  if (searchParams.get("error_code") || searchParams.get("error")) return gagal();

  const supabase = await buatKlienServer();
  const tokenHash = searchParams.get("token_hash");
  const kode = searchParams.get("code");

  if (tokenHash && jenis && JENIS_OTP.includes(jenis as EmailOtpType)) {
    const { error } = await supabase.auth.verifyOtp({
      type: jenis as EmailOtpType,
      token_hash: tokenHash,
    });
    if (error) return gagal();
  } else if (kode) {
    const { error } = await supabase.auth.exchangeCodeForSession(kode);
    if (error) {
      return pemulihan ? gagal() : alihkan("/masuk?verifikasi=berhasil");
    }
  } else {
    return gagal();
  }

  // Akun nonaktif tidak boleh memakai sesi baru.
  const { data } = await supabase.auth.getClaims();
  const uid = data?.claims?.sub;
  const profil = uid ? await ambilProfil(uid) : null;
  if (!profil || !profil.is_aktif) {
    await supabase.auth.signOut();
    return alihkan(profil ? "/masuk?galat=nonaktif" : "/masuk?verifikasi=berhasil");
  }

  if (pemulihan) return alihkan(HALAMAN_ATUR_ULANG);
  return alihkan(profil.peran === "admin" && tujuan === "/dashboard" ? "/admin" : tujuan);
}
