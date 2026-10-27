const ASAL_UJI = "http://nadalaya.invalid";
const KARAKTER_TERLARANG = /[\\\u0000-\u001f\u007f]/;

/**
 * Hanya jalur relatif di situs ini yang lolos; selain itu dikembalikan `cadangan`.
 * Backslash dan karakter kontrol ditolak karena browser mengubahnya menjadi "//".
 */
export function jalurInternal(nilai: unknown, cadangan = "/dashboard"): string {
  if (typeof nilai !== "string" || !nilai.startsWith("/") || nilai.startsWith("//")) return cadangan;
  if (KARAKTER_TERLARANG.test(nilai)) return cadangan;
  try {
    const url = new URL(nilai, ASAL_UJI);
    if (url.origin !== ASAL_UJI) return cadangan;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return cadangan;
  }
}

/** Sesi dari tautan email (lupa kata sandi) berlaku untuk mengganti sandi selama 30 menit. */
export const BATAS_SESI_PEMULIHAN_MENIT = 30;
const METODE_PEMULIHAN = ["recovery", "otp"];

type EntriAmr = { method?: string; timestamp?: number } | string;

export function sesiPemulihan(amr: unknown, sekarang: Date = new Date()): boolean {
  if (!Array.isArray(amr)) return false;
  const batas = sekarang.getTime() / 1000 - BATAS_SESI_PEMULIHAN_MENIT * 60;
  return (amr as EntriAmr[]).some(
    (e) =>
      typeof e === "object" &&
      e !== null &&
      METODE_PEMULIHAN.includes(e.method ?? "") &&
      typeof e.timestamp === "number" &&
      e.timestamp >= batas,
  );
}

export const SITUS_PENGEMBANGAN = "http://localhost:3000";

/** Alamat situs untuk tautan email; wajib diisi di produksi. */
export function tentukanAlamatSitus(nilai: string | undefined, produksi: boolean): string {
  const isi = nilai?.trim();
  if (!isi) {
    if (produksi) throw new Error("NEXT_PUBLIC_SITE_URL wajib diisi di produksi (mis. https://nadalaya.onrender.com).");
    return SITUS_PENGEMBANGAN;
  }
  let url: URL;
  try {
    url = new URL(isi);
  } catch {
    throw new Error("NEXT_PUBLIC_SITE_URL harus berupa URL lengkap, mis. https://nadalaya.onrender.com.");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("NEXT_PUBLIC_SITE_URL harus diawali http:// atau https://.");
  }
  return url.origin;
}

export function alamatSitus(): string {
  return tentukanAlamatSitus(process.env.NEXT_PUBLIC_SITE_URL, process.env.NODE_ENV === "production");
}
