/** Daftar paket freemium sesuai SRS Tabel 2.1. */
export type InfoPaket = {
  kode: "gratis" | "uji_coba" | "premium_bulanan" | "persiapan_tes";
  nama: string;
  harga: number;
  satuan: string;
  ringkasan: string;
  fitur: string[];
  unggulan?: boolean;
  catatan?: string;
};

export const DAFTAR_PAKET: InfoPaket[] = [
  {
    kode: "gratis",
    nama: "Gratis",
    harga: 0,
    satuan: "selamanya",
    ringkasan: "Mulai berlatih dasar-dasar solfeggio.",
    fitur: [
      "3 analisis per hari",
      "Materi tangga nada dasar",
      "Skor dan grafik nada setiap latihan",
    ],
  },
  {
    kode: "uji_coba",
    nama: "Uji Coba Premium",
    harga: 0,
    satuan: "7 hari",
    ringkasan: "Rasakan semua fitur Premium sebelum membayar.",
    fitur: [
      "Setara Premium selama 7 hari",
      "Analisis tanpa batas",
      "Semua materi interval dan melodi",
      "Riwayat latihan dan grafik progres",
    ],
    catatan: "Satu kali per akun",
  },
  {
    kode: "premium_bulanan",
    nama: "Premium",
    harga: 39_000,
    satuan: "bulan",
    ringkasan: "Untuk latihan rutin setiap hari.",
    fitur: [
      "Analisis tanpa batas",
      "Semua materi interval dan melodi",
      "Riwayat latihan",
      "Grafik progres skor",
    ],
    unggulan: true,
  },
  {
    kode: "persiapan_tes",
    nama: "Paket Persiapan Tes",
    harga: 99_000,
    satuan: "3 bulan",
    ringkasan: "Persiapan penuh menjelang tes keterampilan musik.",
    fitur: [
      "Setara Premium selama 90 hari",
      "Analisis tanpa batas",
      "Semua materi interval dan melodi",
      "Grafik progres skor",
    ],
    catatan: "Lebih hemat Rp18.000 dibanding 3 bulan Premium",
  },
];

export function formatRupiah(nilai: number) {
  return `Rp${nilai.toLocaleString("id-ID")}`;
}

/**
 * Nilai satu sel tabel perbandingan: true = tersedia, false = tidak,
 * string = keterangan teks.
 */
export type NilaiHakAkses = boolean | string;

/**
 * Perbandingan hak akses per paket (SRS Tabel 2.1 dan 2.3). Urutan kolom
 * mengikuti DAFTAR_PAKET: Gratis, Uji Coba, Premium, Persiapan Tes.
 */
export const PERBANDINGAN_HAK_AKSES: {
  fitur: string;
  nilai: [NilaiHakAkses, NilaiHakAkses, NilaiHakAkses, NilaiHakAkses];
}[] = [
  {
    fitur: "Kuota analisis harian",
    nilai: ["3 kali", "Tanpa batas", "Tanpa batas", "Tanpa batas"],
  },
  { fitur: "Materi tangga nada dasar", nilai: [true, true, true, true] },
  { fitur: "Materi interval dan melodi", nilai: [false, true, true, true] },
  { fitur: "Skor dan grafik nada tiap latihan", nilai: [true, true, true, true] },
  { fitur: "Riwayat latihan", nilai: [false, true, true, true] },
  { fitur: "Grafik progres skor", nilai: [false, true, true, true] },
  {
    fitur: "Masa aktif",
    nilai: ["Tanpa batas", "7 hari, sekali per akun", "30 hari", "90 hari"],
  },
];
