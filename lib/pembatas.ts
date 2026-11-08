import { createHash } from "node:crypto";
import { GalatRute } from "@/lib/galatRute";
import { ringkasGalat } from "@/lib/permintaan";
import { migrasiBelumDijalankan } from "@/lib/sesiAnalisis";

const MENIT = 60 * 1000;
const JAM = 60 * MENIT;

/**
 * Aturan batas berjendela geser beserta catatan cadangannya di memori proses.
 * Catatan utama disimpan di Supabase (migrasi-05) agar berlaku di semua instance;
 * catatan memori hanya dipakai bila penyimpanan bersama tidak tersedia.
 */
export class Pembatas {
  private readonly catatan = new Map<string, number[]>();
  private panggilan = 0;

  constructor(
    readonly nama: string,
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

export type AturanBatas = [Pembatas, string | null | undefined];
export type Percobaan = { pembatas: Pembatas; kunci: string };

/** Detik tunggu dari penyimpanan bersama (0 = dicatat), atau null bila tidak tersedia. */
export type PencatatPercobaan = (daftar: Percobaan[]) => Promise<number | null>;

/** Semua aturan diperiksa dulu; bila salah satu penuh, tidak ada yang dicatat. */
export function catatDiMemori(daftar: Percobaan[]): number {
  const tunggu = Math.max(0, ...daftar.map(({ pembatas, kunci }) => pembatas.tunggu(kunci)));
  if (tunggu === 0) for (const { pembatas, kunci } of daftar) pembatas.catat(kunci);
  return tunggu;
}

/** IP dan email tidak disimpan apa adanya di database. */
export function kunciTersamar(nama: string, kunci: string) {
  return createHash("sha256").update(`${nama}:${kunci}`).digest("hex");
}

export function argumenCatatPercobaan(daftar: Percobaan[]) {
  return {
    p_kunci: daftar.map(({ pembatas, kunci }) => kunciTersamar(pembatas.nama, kunci)),
    p_batas: daftar.map(({ pembatas }) => pembatas.batas),
    p_jendela_detik: daftar.map(({ pembatas }) => Math.ceil(pembatas.jendelaMs / 1000)),
  };
}

type HasilRpc = { data: unknown; error: { code?: string; message?: string } | null };

/** Pencatat lewat fungsi catat_percobaan; galat dicatat di log lalu jatuh ke pembatas memori. */
export function buatPencatatSupabase(
  rpc: (fungsi: string, argumen: ReturnType<typeof argumenCatatPercobaan>) => PromiseLike<HasilRpc>,
): PencatatPercobaan {
  let sudahDiperingatkan = false;
  return async (daftar) => {
    try {
      const { data, error } = await rpc("catat_percobaan", argumenCatatPercobaan(daftar));
      if (!error && typeof data === "number") return data;
      if (migrasiBelumDijalankan(error)) {
        if (!sudahDiperingatkan) {
          console.warn("[pembatas] fungsi catat_percobaan belum dibuat (jalankan migrasi-05-pembatas.sql); memakai pembatas memori");
          sudahDiperingatkan = true;
        }
      } else {
        console.warn(`[pembatas] penyimpanan bersama gagal, memakai pembatas memori: ${error ? ringkasGalat(error) : "hasil tidak valid"}`);
      }
    } catch (err) {
      console.warn(`[pembatas] penyimpanan bersama gagal, memakai pembatas memori: ${ringkasGalat(err)}`);
    }
    return null;
  };
}

/**
 * Memeriksa semua pembatas; bila salah satu penuh, lempar 429 tanpa mencatat apa pun.
 * Kunci kosong dilewati.
 */
export async function batasiDengan(aturan: AturanBatas[], pencatat?: PencatatPercobaan) {
  const daftar = aturan
    .filter((a): a is [Pembatas, string] => !!a[1])
    .map(([pembatas, kunci]) => ({ pembatas, kunci }));
  if (daftar.length === 0) return;

  const tunggu = (pencatat ? await pencatat(daftar) : null) ?? catatDiMemori(daftar);
  if (tunggu > 0) {
    throw new GalatRute(
      429,
      `Terlalu banyak percobaan. Silakan coba lagi dalam ${formatTunggu(tunggu)}.`,
      "terlalu_sering",
      { "Retry-After": String(tunggu) },
    );
  }
}

export const PEMBATAS = {
  masukEmail: new Pembatas("masuk-email", 5, 15 * MENIT),
  masukIp: new Pembatas("masuk-ip", 20, 15 * MENIT),
  daftarEmail: new Pembatas("daftar-email", 3, JAM),
  daftarIp: new Pembatas("daftar-ip", 10, JAM),
  lupaSandiEmail: new Pembatas("lupa-sandi-email", 3, JAM),
  lupaSandiIp: new Pembatas("lupa-sandi-ip", 10, JAM),
  kirimUlangEmail: new Pembatas("kirim-ulang-email", 3, JAM),
  kirimUlangIp: new Pembatas("kirim-ulang-ip", 10, JAM),
  sesiPengguna: new Pembatas("sesi-pengguna", 20, JAM),
};
