import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { jalurInternal } from "@/lib/keamanan";
import {
  alasanGagal,
  alurKonfirmasi,
  halamanBerhasil,
  halamanGagal,
  HALAMAN_TERVERIFIKASI_PERLU_MASUK,
} from "@/lib/konfirmasi";
import { ambilProfil } from "@/lib/server/pengguna";
import { buatKlienServer } from "@/lib/supabase/server";

const JENIS_OTP: EmailOtpType[] = ["signup", "invite", "magiclink", "recovery", "email_change", "email"];

export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const tujuan = jalurInternal(searchParams.get("next"));
  const alur = alurKonfirmasi(searchParams.get("type"), tujuan);
  const alihkan = (jalur: string) => NextResponse.redirect(new URL(jalur, origin));
  const gagal = (kode?: string | null) => alihkan(halamanGagal(alur, alasanGagal(kode)));

  // Supabase menambahkan error_code (mis. otp_expired) bila tautan tidak berlaku.
  if (searchParams.get("error_code") || searchParams.get("error")) return gagal(searchParams.get("error_code"));

  const supabase = await buatKlienServer();
  const tokenHash = searchParams.get("token_hash");
  const jenis = searchParams.get("type");
  const kode = searchParams.get("code");

  if (tokenHash && jenis && JENIS_OTP.includes(jenis as EmailOtpType)) {
    const { error } = await supabase.auth.verifyOtp({
      type: jenis as EmailOtpType,
      token_hash: tokenHash,
    });
    if (error) return gagal(error.code);
  } else if (kode) {
    const { error } = await supabase.auth.exchangeCodeForSession(kode);
    if (error) {
      // Email sudah diverifikasi Supabase sebelum mengalihkan; sesi gagal dibuat (mis. dibuka di browser lain).
      return alur === "pemulihan" ? gagal(error.code) : alihkan(HALAMAN_TERVERIFIKASI_PERLU_MASUK);
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

  return alihkan(halamanBerhasil(alur, tujuan, profil.peran));
}
