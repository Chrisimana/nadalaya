/*
 * Validasi formulir di sisi klien. Server tetap memvalidasi ulang nanti.
 * Pesan mengikuti UCD pada SRS (UC-01, UC-02).
 */

export const MIN_PANJANG_SANDI = 8;

const POLA_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type GalatKolom<T extends string> = Partial<Record<T, string>>;

export function validasiNama(nama: string) {
  const bersih = nama.trim();
  if (!bersih) return "Nama wajib diisi.";
  if (bersih.length < 2) return "Nama minimal 2 karakter.";
  if (bersih.length > 100) return "Nama maksimal 100 karakter.";
  return undefined;
}

export function validasiEmail(email: string) {
  const bersih = email.trim();
  if (!bersih) return "Email wajib diisi.";
  if (!POLA_EMAIL.test(bersih)) {
    return "Format email tidak valid. Contoh: nama@email.com";
  }
  return undefined;
}

export function validasiKataSandiBaru(kataSandi: string) {
  if (!kataSandi) return "Kata sandi wajib diisi.";
  if (kataSandi.length < MIN_PANJANG_SANDI) {
    return `Kata sandi minimal ${MIN_PANJANG_SANDI} karakter.`;
  }
  return undefined;
}

export function validasiRegistrasi(data: {
  nama: string;
  email: string;
  kataSandi: string;
}): GalatKolom<"nama" | "email" | "kataSandi"> {
  return buangKosong({
    nama: validasiNama(data.nama),
    email: validasiEmail(data.email),
    kataSandi: validasiKataSandiBaru(data.kataSandi),
  });
}

export function validasiMasuk(data: {
  email: string;
  kataSandi: string;
}): GalatKolom<"email" | "kataSandi"> {
  return buangKosong({
    email: validasiEmail(data.email),
    kataSandi: data.kataSandi ? undefined : "Kata sandi wajib diisi.",
  });
}

export function validasiKataSandiBaruDanKonfirmasi(data: {
  kataSandi: string;
  konfirmasi: string;
}): GalatKolom<"kataSandi" | "konfirmasi"> {
  return buangKosong({
    kataSandi: validasiKataSandiBaru(data.kataSandi),
    konfirmasi: !data.konfirmasi
      ? "Konfirmasi kata sandi wajib diisi."
      : data.konfirmasi !== data.kataSandi
        ? "Konfirmasi kata sandi tidak sama."
        : undefined,
  });
}

export const TEMPO_MIN = 40;
export const TEMPO_MAX = 240;

/** Validasi berkas MIDI di klien: ekstensi .mid dan ukuran (UC-21). Isi diperiksa server. */
export function validasiBerkasMidi(berkas: File | null, wajib: boolean) {
  if (!berkas) return wajib ? "Berkas MIDI wajib diunggah." : undefined;
  if (!berkas.name.toLowerCase().endsWith(".mid")) {
    return "Berkas harus berformat .mid";
  }
  if (berkas.size === 0) return "Berkas MIDI kosong.";
  if (berkas.size > 1024 * 1024) return "Ukuran berkas MIDI maksimal 1 MB.";
  return undefined;
}

/** Validasi formulir materi (UC-21, UC-22). */
export function validasiMateri(
  data: { judul: string; tempo: string; berkasMidi: File | null },
  mode: "tambah" | "ubah",
): GalatKolom<"judul" | "tempo" | "berkasMidi"> {
  const judul = data.judul.trim();
  const tempo = Number(data.tempo);
  return buangKosong({
    judul: !judul
      ? "Judul wajib diisi."
      : judul.length > 100
        ? "Judul maksimal 100 karakter."
        : undefined,
    tempo: !data.tempo.trim()
      ? "Tempo wajib diisi."
      : !Number.isInteger(tempo) || tempo < TEMPO_MIN || tempo > TEMPO_MAX
        ? `Tempo harus bilangan bulat ${TEMPO_MIN}–${TEMPO_MAX} BPM.`
        : undefined,
    berkasMidi: validasiBerkasMidi(data.berkasMidi, mode === "tambah"),
  });
}

function buangKosong<T extends Record<string, string | undefined>>(obj: T) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, nilai]) => nilai !== undefined),
  ) as Partial<T>;
}

export function adaGalat(galat: Record<string, unknown>) {
  return Object.keys(galat).length > 0;
}
