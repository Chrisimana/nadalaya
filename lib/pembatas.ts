import { GalatRute } from "@/lib/galatRute";

const MENIT = 60 * 1000;
const JAM = 60 * MENIT;

/**
 * Pembatas percobaan berjendela geser yang disimpan di memori proses.
 * Cukup untuk satu instance; bila aplikasi berjalan di banyak instance,
 * catatan harus dipindah ke penyimpanan bersama (mis. tabel Supabase atau Redis).
 */
export class Pembatas {
  private readonly catatan = new Map<string, number[]>();
  private panggilan = 0;

  constructor(
    readonly batas: number,
    readonly jendelaMs: number,
    private readonly jam: () => number = Date.now,
  ) {}

  private aktif(kunci: string, sekarang: number) {
    const waktu = (this.catatan.get(kunci) ?? []).filter((t) => t > sekarang - this.jendelaMs);
    if (waktu.length) this.catatan.set(kunci, waktu);
    else this.catatan.delete(kunci);
    return waktu;
  }

  /** Detik yang harus ditunggu; 0 bila masih boleh. */
  tunggu(kunci: string): number {
    const sekarang = this.jam();
    const waktu = this.aktif(kunci, sekarang);
    if (waktu.length < this.batas) return 0;
    return Math.max(1, Math.ceil((waktu[0] + this.jendelaMs - sekarang) / 1000));
  }

  catat(kunci: string) {
    const sekarang = this.jam();
    this.catatan.set(kunci, [...this.aktif(kunci, sekarang), sekarang]);
    if (++this.panggilan % 500 === 0) this.bersihkan(sekarang);
  }

  get ukuran() {
    return this.catatan.size;
  }

  private bersihkan(sekarang: number) {
    for (const kunci of [...this.catatan.keys()]) this.aktif(kunci, sekarang);
  }
}

export function formatTunggu(detik: number) {
  if (detik < 60) return `${detik} detik`;
  const menit = Math.ceil(detik / 60);
  return menit < 60 ? `${menit} menit` : `${Math.ceil(menit / 60)} jam`;
}

/**
 * Memeriksa semua pembatas; bila salah satu penuh, lempar 429 tanpa mencatat apa pun.
 * Kunci kosong dilewati.
 */
export function batasi(aturan: [Pembatas, string | null | undefined][]) {
  const berlaku = aturan.filter((a): a is [Pembatas, string] => !!a[1]);
  const tunggu = Math.max(0, ...berlaku.map(([p, k]) => p.tunggu(k)));
  if (tunggu > 0) {
    throw new GalatRute(
      429,
      `Terlalu banyak percobaan. Silakan coba lagi dalam ${formatTunggu(tunggu)}.`,
      "terlalu_sering",
      { "Retry-After": String(tunggu) },
    );
  }
  for (const [p, k] of berlaku) p.catat(k);
}

export const PEMBATAS = {
  masukEmail: new Pembatas(5, 15 * MENIT),
  masukIp: new Pembatas(20, 15 * MENIT),
  daftarEmail: new Pembatas(3, JAM),
  daftarIp: new Pembatas(10, JAM),
  lupaSandiEmail: new Pembatas(3, JAM),
  lupaSandiIp: new Pembatas(10, JAM),
  kirimUlangEmail: new Pembatas(3, JAM),
  kirimUlangIp: new Pembatas(10, JAM),
  sesiPengguna: new Pembatas(20, JAM),
};
