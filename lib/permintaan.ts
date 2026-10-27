import { GalatRute } from "@/lib/galatRute";

export const BATAS_JSON = 16 * 1024;
export const BATAS_JSON_HASIL = 1024 * 1024;
/** Berkas MIDI maksimal 1 MB ditambah field formulir lain. */
export const BATAS_FORM_MIDI = Math.round(1.2 * 1024 * 1024);

const PESAN_TERLALU_BESAR = "Ukuran data yang dikirim terlalu besar.";

function terlaluBesar(): never {
  throw new GalatRute(413, PESAN_TERLALU_BESAR, "terlalu_besar");
}

function panjangKonten(req: Request): number | null {
  const nilai = req.headers.get("content-length");
  if (nilai === null) return null;
  const angka = Number(nilai);
  return Number.isSafeInteger(angka) && angka >= 0 ? angka : null;
}

/** Membaca body sebagai teks dan berhenti begitu melewati `batas` byte. */
export async function bacaTeksTerbatas(req: Request, batas: number): Promise<string> {
  const panjang = panjangKonten(req);
  if (panjang !== null && panjang > batas) terlaluBesar();
  if (!req.body) return "";

  const pembaca = req.body.getReader();
  const potongan: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await pembaca.read();
    if (done) break;
    total += value.byteLength;
    if (total > batas) {
      await pembaca.cancel().catch(() => {});
      terlaluBesar();
    }
    potongan.push(value);
  }

  const gabungan = new Uint8Array(total);
  let posisi = 0;
  for (const p of potongan) {
    gabungan.set(p, posisi);
    posisi += p.byteLength;
  }
  return new TextDecoder().decode(gabungan);
}

export function wajibJson(req: Request) {
  const jenis = (req.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (jenis !== "application/json") {
    throw new GalatRute(415, "Format permintaan harus JSON.", "format_tidak_didukung");
  }
}

/** Unggahan formulir wajib menyebut ukurannya dan tidak boleh melewati `batas`. */
export function wajibUkuranForm(req: Request, batas: number) {
  const panjang = panjangKonten(req);
  if (panjang === null) {
    throw new GalatRute(411, "Ukuran unggahan tidak diketahui. Silakan coba lagi.", "panjang_wajib");
  }
  if (panjang > batas) {
    throw new GalatRute(413, "Ukuran unggahan terlalu besar. Berkas MIDI maksimal 1 MB.", "terlalu_besar");
  }
}

const METODE_AMAN = new Set(["GET", "HEAD", "OPTIONS"]);

/** Menolak permintaan non-GET dari situs lain (CSRF); permintaan tanpa Origin tetap diproses. */
export function wajibAsalSama(req: Request, alamatSitus: () => string) {
  if (METODE_AMAN.has(req.method)) return;
  const asal = req.headers.get("origin");
  if (asal === null || asal === alamatSitus()) return;
  throw new GalatRute(403, "Permintaan dari situs lain ditolak.", "asal_ditolak");
}

const POLA_IP = /^[0-9a-fA-F:.]{2,45}$/;

/** IP klien dari nilai pertama x-forwarded-for (diisi proxy Render); fallback bila kosong atau tidak sah. */
export function ipKlien(header: Headers): string {
  for (const nilai of [header.get("x-forwarded-for")?.split(",")[0], header.get("x-real-ip")]) {
    const ip = nilai?.trim();
    if (ip && POLA_IP.test(ip)) return ip;
  }
  return "tidak-diketahui";
}

/** Galat database/layanan hanya dicatat kode dan pesannya; detail bisa memuat data pengguna. */
export function ringkasGalat(err: unknown): string {
  if (err && typeof err === "object") {
    const { code, message, name } = err as { code?: unknown; message?: unknown; name?: unknown };
    if (code !== undefined) return `${String(code)} ${String(message ?? "")}`.trim();
    if (err instanceof Error) return err.stack ?? `${name}: ${message}`;
    return String(message ?? "galat tanpa pesan");
  }
  return String(err);
}
