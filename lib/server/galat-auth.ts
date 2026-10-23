import "server-only";

import type { AuthError } from "@supabase/supabase-js";
import { GalatRute } from "./respons";

export function galatAuth(err: AuthError): GalatRute {
  switch (err.code) {
    case "invalid_credentials":
      return new GalatRute(401, "Email atau kata sandi salah.", "kredensial_salah");
    case "email_not_confirmed":
      return new GalatRute(
        403,
        "Email Anda belum diverifikasi. Buka tautan verifikasi yang kami kirim ke email Anda.",
        "email_belum_verifikasi",
      );
    case "user_already_exists":
    case "email_exists":
      return new GalatRute(
        409,
        "Email sudah terdaftar. Silakan masuk atau gunakan email lain.",
        "email_terdaftar",
      );
    case "weak_password":
      return new GalatRute(400, "Kata sandi terlalu lemah. Gunakan minimal 8 karakter.", "sandi_lemah");
    case "same_password":
      return new GalatRute(400, "Kata sandi baru harus berbeda dari kata sandi lama.", "sandi_sama");
    case "email_address_invalid":
      return new GalatRute(400, "Format email tidak valid.", "email_tidak_valid");
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return new GalatRute(
        429,
        "Terlalu banyak permintaan. Tunggu beberapa menit, lalu coba lagi.",
        "terlalu_sering",
      );
    case "session_not_found":
    case "session_expired":
    case "refresh_token_not_found":
      return new GalatRute(401, "Sesi Anda telah berakhir. Silakan masuk kembali.", "belum_masuk");
    case "user_banned":
      // Akun yang dinonaktifkan admin juga diblokir di Supabase Auth.
      return new GalatRute(403, "Akun Anda telah dinonaktifkan.", "akun_nonaktif");
    case "signup_disabled":
      return new GalatRute(403, "Pendaftaran akun sedang ditutup.", "pendaftaran_ditutup");
    default:
      console.error("[auth]", err.code, err.message);
      return new GalatRute(
        err.status && err.status >= 400 && err.status < 500 ? err.status : 500,
        "Terjadi kesalahan pada layanan akun. Silakan coba lagi.",
        "galat_auth",
      );
  }
}
