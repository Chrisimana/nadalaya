// Keputusan pengalihan untuk tautan email di /auth/konfirmasi.

export const HALAMAN_ATUR_ULANG = "/atur-ulang-kata-sandi";
export const HALAMAN_TERVERIFIKASI = "/auth/terverifikasi";
export const HALAMAN_VERIFIKASI_GAGAL = "/auth/verifikasi-gagal";

/** pemulihan = lupa kata sandi; verifikasi = verifikasi email pendaftaran; lainnya = mis. ganti email. */
export type AlurKonfirmasi = "pemulihan" | "verifikasi" | "lainnya";
export type AlasanGagal = "kedaluwarsa" | "tidak_valid";

// Supabase memakai type "signup" atau "email" untuk tautan verifikasi pendaftaran.
const JENIS_VERIFIKASI = ["signup", "email"];

export function alurKonfirmasi(jenis: string | null, tujuan: string): AlurKonfirmasi {
  if (jenis === "recovery" || tujuan === HALAMAN_ATUR_ULANG) return "pemulihan";
  // Alur kode (PKCE) tidak membawa type; selain pemulihan, tautan dari Nadalaya adalah verifikasi.
  if (jenis === null || JENIS_VERIFIKASI.includes(jenis)) return "verifikasi";
  return "lainnya";
}

export function alasanGagal(kode: string | null | undefined): AlasanGagal {
  return kode === "otp_expired" ? "kedaluwarsa" : "tidak_valid";
}

export function halamanGagal(alur: AlurKonfirmasi, alasan: AlasanGagal) {
  return alur === "pemulihan"
    ? `${HALAMAN_ATUR_ULANG}?galat=kedaluwarsa`
    : `${HALAMAN_VERIFIKASI_GAGAL}?alasan=${alasan}`;
}

export function halamanBerhasil(alur: AlurKonfirmasi, tujuan: string, peran: "pengguna" | "admin") {
  const lanjut = peran === "admin" && tujuan === "/dashboard" ? "/admin" : tujuan;
  if (alur === "pemulihan") return HALAMAN_ATUR_ULANG;
  if (alur === "verifikasi") return `${HALAMAN_TERVERIFIKASI}?lanjut=${encodeURIComponent(lanjut)}`;
  return lanjut;
}

/** Tautan sudah diverifikasi Supabase, tetapi sesi tidak bisa dibuat di browser ini: minta masuk manual. */
export const HALAMAN_TERVERIFIKASI_PERLU_MASUK = `${HALAMAN_TERVERIFIKASI}?masuk=1`;
