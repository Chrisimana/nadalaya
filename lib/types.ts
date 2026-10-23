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
  tempo: number;
  terkunci?: boolean;
};

export type NadaAcuan = {
  midi: number;
  waktu: number;
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
  tanggalBerakhir: string | null;
};

export type HasilCekAkses =
  | { diizinkan: true; sisaKuota: number | null }
  | { diizinkan: false; alasan: "materi_premium" }
  | { diizinkan: false; alasan: "kuota_habis"; waktuReset: string };

export type TitikPitch = {
  waktu: number;
  midi: number | null;
};

export type NadaMeleset = {
  urutan: number;
  midiAcuan: number;
  selisihCent: number | null;
  waktu: number;
};

export type HasilAnalisis = {
  skor: number;
  kontur: TitikPitch[];
  acuan: NadaAcuan[];
  nadaMeleset: NadaMeleset[];
};

export type ItemRiwayat = {
  id: string;
  materiId: string;
  judulMateri: string;
  jenis: JenisMateri;
  skor: number;
  tanggal: string;
};

export type RingkasanDashboard = {
  pengguna: Pengguna | null;
  sisaKuota: number | null;
  materiTerakhir: Materi | null;
  skorTerbaru: { skor: number; judulMateri: string; tanggal: string } | null;
  /** true bila uji coba pernah dipakai dan paket kini kembali Gratis. */
  ujiCobaBerakhir: boolean;
};

export type KodePaketBerbayar = "premium_bulanan" | "persiapan_tes";

export type InfoLangganan = {
  statusPaket: StatusPaket;
  tanggalBerakhir: string | null;
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
  metode: string | null;
  status: StatusTransaksi;
  dibuat: string;
  dibayar: string | null;
};

export type DetailRiwayat = ItemRiwayat & { hasil: HasilAnalisis };

export type TitikProgres = {
  tanggal: string;
  jenis: JenisMateri;
  skor: number;
};


export type RingkasanAdmin = {
  jumlahPengguna: number;
  jumlahLatihan: number;
  transaksiBerhasil: number;
  pendapatan: number;
};

export type MateriAdmin = Materi & {
  isAktif: boolean;
  dipakaiLatihan: boolean;
  namaBerkasMidi: string | null;
};

export type PenggunaAdmin = Pengguna & {
  isAktif: boolean;
  terdaftar: string;
  jumlahLatihan: number;
};

export type DetailPenggunaAdmin = PenggunaAdmin & {
  latihanTerakhir: ItemRiwayat[];
};

export type StatistikLatihan = {
  jumlahSesi: number;
  rataRataSkor: number | null;
  materiTerpopuler: { judul: string; jumlah: number } | null;
  penggunaAktif: number;
  perHari: { tanggal: string; jumlah: number }[];
};

export type TransaksiAdmin = Transaksi & {
  namaPengguna: string;
  emailPengguna: string;
};
