/*
 * Tipe data bersama Nadalaya. Nama kolom mengikuti rancangan basis data
 * pada SDD (users, materi_latihan, riwayat_latihan, sesi_analisis, transaksi).
 */

export type JenisMateri = "tangga_nada" | "interval" | "melodi";
export type TingkatMateri = "dasar" | "menengah" | "mahir";

export const LABEL_JENIS: Record<JenisMateri, string> = {
  tangga_nada: "Tangga Nada",
  interval: "Interval",
  melodi: "Melodi",
};

export const LABEL_TINGKAT: Record<TingkatMateri, string> = {
  dasar: "Dasar",
  menengah: "Menengah",
  mahir: "Mahir",
};

export const URUTAN_JENIS: JenisMateri[] = ["tangga_nada", "interval", "melodi"];
export const URUTAN_TINGKAT: TingkatMateri[] = ["dasar", "menengah", "mahir"];

export type Materi = {
  id: string;
  judul: string;
  jenis: JenisMateri;
  tingkat: TingkatMateri;
  isPremium: boolean;
  /** Tempo dalam ketukan per menit (BPM). */
  tempo: number;
  /** Diisi saat pengguna membuka materi yang dikunci (FR-07). */
  terkunci?: boolean;
};

/** Satu nada acuan hasil pembacaan berkas MIDI (@tonejs/midi). */
export type NadaAcuan = {
  /** Nomor nada MIDI, misalnya 60 = C4. */
  midi: number;
  /** Waktu mulai dalam detik. */
  waktu: number;
  /** Durasi dalam detik. */
  durasi: number;
};

export type MateriLengkap = Materi & {
  nada: NadaAcuan[];
};

export type StatusPaket = "gratis" | "uji_coba" | "premium";

export const LABEL_PAKET: Record<StatusPaket, string> = {
  gratis: "Gratis",
  uji_coba: "Uji Coba Premium",
  premium: "Premium",
};

export type Pengguna = {
  id: string;
  nama: string;
  email: string;
  peran: "pengguna" | "admin";
  statusPaket: StatusPaket;
  /** ISO 8601, null untuk paket Gratis. */
  tanggalBerakhir: string | null;
};

/** Hasil pemeriksaan hak akses dan kuota di sisi server (FR-08, FR-09). */
export type HasilCekAkses =
  | { diizinkan: true; sisaKuota: number | null }
  | { diizinkan: false; alasan: "materi_premium" }
  | { diizinkan: false; alasan: "kuota_habis"; waktuReset: string };

/** Satu titik kontur pitch nyanyian hasil CREPE. */
export type TitikPitch = {
  /**
   * Waktu dalam detik. Pada HasilAnalisis, waktu sudah dipetakan ke sumbu
   * waktu acuan melalui jalur penyelarasan DTW agar dapat dibandingkan.
   */
  waktu: number;
  /** Nada dalam satuan MIDI pecahan (60.5 = C4 + 50 cent), null bila tidak bersuara. */
  midi: number | null;
};

export type NadaMeleset = {
  /** Urutan nada pada acuan, dimulai dari 1. */
  urutan: number;
  midiAcuan: number;
  /** Selisih rata-rata dalam cent; positif = terlalu tinggi. */
  selisihCent: number;
  /** Waktu nada pada acuan (detik). */
  waktu: number;
};

export type HasilAnalisis = {
  /** Skor akurasi 0–100 (FR-14). */
  skor: number;
  kontur: TitikPitch[];
  acuan: NadaAcuan[];
  nadaMeleset: NadaMeleset[];
};

/** Satu baris riwayat latihan (FR-16). */
export type ItemRiwayat = {
  id: string;
  materiId: string;
  judulMateri: string;
  jenis: JenisMateri;
  skor: number;
  /** ISO 8601. */
  tanggal: string;
};

export type RingkasanDashboard = {
  pengguna: Pengguna | null;
  /** null berarti tanpa batas (Premium) atau belum diketahui. */
  sisaKuota: number | null;
  materiTerakhir: Materi | null;
  skorTerbaru: { skor: number; judulMateri: string; tanggal: string } | null;
};

/** Paket yang dapat dibeli (SDD: premium_bulanan, persiapan_tes). */
export type KodePaketBerbayar = "premium_bulanan" | "persiapan_tes";

export type InfoLangganan = {
  statusPaket: StatusPaket;
  /** ISO 8601, null untuk paket Gratis. */
  tanggalBerakhir: string | null;
  /** Uji coba hanya dapat diaktifkan satu kali per akun (FR-18). */
  ujiCobaDigunakan: boolean;
};

export type StatusTransaksi = "tertunda" | "berhasil" | "gagal" | "kedaluwarsa";

export const LABEL_STATUS_TRANSAKSI: Record<StatusTransaksi, string> = {
  tertunda: "Tertunda",
  berhasil: "Berhasil",
  gagal: "Gagal",
  kedaluwarsa: "Kedaluwarsa",
};

export type Transaksi = {
  orderId: string;
  paket: KodePaketBerbayar;
  nominal: number;
  /** Contoh: "Virtual Account BCA", "QRIS". Null bila belum dipilih. */
  metode: string | null;
  status: StatusTransaksi;
  /** ISO 8601. */
  dibuat: string;
  /** ISO 8601, terisi saat pembayaran berhasil. */
  dibayar: string | null;
};

/** Detail satu riwayat latihan untuk ditampilkan ulang (UC-14 langkah 2). */
export type DetailRiwayat = ItemRiwayat & { hasil: HasilAnalisis };

/** Satu titik grafik progres skor (UC-15). */
export type TitikProgres = {
  /** ISO 8601. */
  tanggal: string;
  jenis: JenisMateri;
  skor: number;
};

/* ---------- Admin ---------- */

export type RingkasanAdmin = {
  jumlahPengguna: number;
  jumlahLatihan: number;
  transaksiBerhasil: number;
  /** Total nominal transaksi berhasil (Rupiah). */
  pendapatan: number;
};

export type MateriAdmin = Materi & {
  isAktif: boolean;
  /** true bila sudah dipakai latihan; hapus hanya menonaktifkan (SDD 3.2.8). */
  dipakaiLatihan: boolean;
  namaBerkasMidi: string | null;
};

export type PenggunaAdmin = Pengguna & {
  isAktif: boolean;
  /** ISO 8601. */
  terdaftar: string;
  jumlahLatihan: number;
};

export type StatistikLatihan = {
  jumlahSesi: number;
  /** null bila belum ada latihan. */
  rataRataSkor: number | null;
  materiTerpopuler: { judul: string; jumlah: number } | null;
  penggunaAktif: number;
  perHari: { tanggal: string; jumlah: number }[];
};

export type TransaksiAdmin = Transaksi & {
  namaPengguna: string;
  emailPengguna: string;
};
