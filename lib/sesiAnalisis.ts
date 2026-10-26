import type { NadaAcuan, NadaMeleset, TitikPitch } from "@/lib/types";

/** Samakan dengan batas di supabase/migrasi-02-keamanan-sesi.sql. */
export const UMUR_SESI_MENIT = 15;

export const MAKS_TITIK = 3000;
export const MAKS_NADA = 1000;
/** Waktu memakai skala acuan; acuan hingga ±200 detik masih bisa dianalisis. */
export const MAKS_WAKTU_DETIK = 300;
export const MAKS_DURASI_NADA_DETIK = 60;
export const MAKS_SELISIH_CENT = 2400;

type Aturan = { min: number; maks: number; bulat?: boolean; bolehNull?: boolean; lebihDariMin?: boolean };

const MIDI: Aturan = { min: 0, maks: 127 };
const WAKTU: Aturan = { min: 0, maks: MAKS_WAKTU_DETIK };

const ATURAN_KONTUR = { waktu: WAKTU, midi: { ...MIDI, bolehNull: true } };
const ATURAN_ACUAN = {
  midi: { ...MIDI, bulat: true },
  waktu: WAKTU,
  durasi: { min: 0, maks: MAKS_DURASI_NADA_DETIK, lebihDariMin: true },
};
const ATURAN_MELESET = {
  urutan: { min: 0, maks: MAKS_NADA, bulat: true },
  midiAcuan: { ...MIDI, bulat: true },
  selisihCent: { min: -MAKS_SELISIH_CENT, maks: MAKS_SELISIH_CENT, bolehNull: true },
  waktu: WAKTU,
};

export type DataHasil = {
  skor: number;
  kontur: TitikPitch[];
  acuan: NadaAcuan[];
  nadaMeleset: NadaMeleset[];
};

export type HasilValidasi = { sah: true; data: DataHasil } | { sah: false; pesan: string };

class TidakSah extends Error {}

function nilaiSah(nilai: unknown, aturan: Aturan): number | null {
  if (nilai === null || nilai === undefined) {
    if (aturan.bolehNull) return null;
    throw new TidakSah();
  }
  if (typeof nilai !== "number" || !Number.isFinite(nilai)) throw new TidakSah();
  if (aturan.bulat && !Number.isInteger(nilai)) throw new TidakSah();
  if (nilai > aturan.maks || nilai < aturan.min || (aturan.lebihDariMin && nilai === aturan.min)) {
    throw new TidakSah();
  }
  return nilai;
}

function daftarSah<K extends string>(nilai: unknown, aturan: Record<K, Aturan>, maks: number) {
  if (!Array.isArray(nilai) || nilai.length > maks) throw new TidakSah();
  return nilai.map((item) => {
    if (!item || typeof item !== "object") throw new TidakSah();
    const hasil = {} as Record<K, number | null>;
    for (const k of Object.keys(aturan) as K[]) {
      hasil[k] = nilaiSah((item as Record<string, unknown>)[k], aturan[k]);
    }
    return hasil;
  });
}

/** Memeriksa tipe dan rentang data hasil analisis dari browser; kolom lain dibuang. */
export function validasiHasil(isi: Record<string, unknown>): HasilValidasi {
  const skor = isi.skor;
  if (typeof skor !== "number" || !Number.isFinite(skor) || skor < 0 || skor > 100) {
    return { sah: false, pesan: "Skor tidak valid." };
  }
  try {
    return {
      sah: true,
      data: {
        skor: Math.round(skor),
        kontur: daftarSah(isi.kontur, ATURAN_KONTUR, MAKS_TITIK) as TitikPitch[],
        acuan: daftarSah(isi.acuan, ATURAN_ACUAN, MAKS_NADA) as NadaAcuan[],
        nadaMeleset: daftarSah(isi.nadaMeleset, ATURAN_MELESET, MAKS_NADA) as NadaMeleset[],
      },
    };
  } catch (err) {
    if (err instanceof TidakSah) return { sah: false, pesan: "Data hasil analisis tidak valid." };
    throw err;
  }
}

export type GalatSesi = { status: number; pesan: string; kode: string };

const GALAT_FUNGSI: Record<string, GalatSesi> = {
  kuota_habis: {
    status: 403,
    pesan: "Kuota analisis harian Anda sudah habis. Kuota direset pukul 00.00 WIB.",
    kode: "kuota_habis",
  },
  sesi_berjalan: {
    status: 409,
    pesan: `Masih ada analisis lain yang sedang berjalan. Tunggu hingga selesai, atau coba lagi dalam ${UMUR_SESI_MENIT} menit.`,
    kode: "sesi_berjalan",
  },
  sesi_kedaluwarsa: {
    status: 410,
    pesan: `Sesi analisis sudah kedaluwarsa (lebih dari ${UMUR_SESI_MENIT} menit). Silakan analisis ulang.`,
    kode: "sesi_kedaluwarsa",
  },
  sesi_tidak_ditemukan: { status: 404, pesan: "Sesi analisis tidak ditemukan.", kode: "sesi_tidak_ditemukan" },
  sesi_tidak_aktif: {
    status: 409,
    pesan: "Sesi analisis ini sudah selesai atau dibatalkan.",
    kode: "sesi_tidak_aktif",
  },
  materi_tidak_ditemukan: {
    status: 404,
    pesan: "Materi tidak ditemukan atau sudah tidak tersedia.",
    kode: "materi_tidak_ditemukan",
  },
  materi_premium: { status: 403, pesan: "Materi ini khusus pengguna Premium.", kode: "materi_premium" },
  akun_nonaktif: { status: 403, pesan: "Akun Anda telah dinonaktifkan.", kode: "akun_nonaktif" },
  pengguna_tidak_ditemukan: { status: 404, pesan: "Akun tidak ditemukan.", kode: "pengguna_tidak_ditemukan" },
};

export const GALAT_BELUM_SIAP: GalatSesi = {
  status: 503,
  pesan: "Fitur analisis sedang diperbarui. Silakan coba lagi nanti.",
  kode: "belum_siap",
};

/** Kode PostgREST/PostgreSQL bila fungsi atau kolom dari migrasi belum ada. */
const KODE_BELUM_DIMIGRASI = ["PGRST202", "42883", "42703"];

export function migrasiBelumDijalankan(err: { code?: string } | null | undefined) {
  return !!err?.code && KODE_BELUM_DIMIGRASI.includes(err.code);
}

/** Menerjemahkan galat fungsi database sesi; null bila galat tidak dikenal. */
export function galatSesi(err: { code?: string; message?: string } | null | undefined): GalatSesi | null {
  if (!err) return null;
  if (migrasiBelumDijalankan(err)) return GALAT_BELUM_SIAP;
  return err.message && Object.hasOwn(GALAT_FUNGSI, err.message) ? GALAT_FUNGSI[err.message] : null;
}
