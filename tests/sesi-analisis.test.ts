import { describe, expect, it } from "vitest";
import {
  GALAT_BELUM_SIAP,
  galatSesi,
  MAKS_NADA,
  MAKS_TITIK,
  migrasiBelumDijalankan,
  validasiHasil,
} from "@/lib/sesiAnalisis";

const sah = () => ({
  skor: 87.6,
  kontur: [
    { waktu: 0, midi: 60.2 },
    { waktu: 0.5, midi: null },
  ],
  acuan: [{ midi: 60, waktu: 0, durasi: 0.5 }],
  nadaMeleset: [{ urutan: 1, midiAcuan: 60, selisihCent: -73, waktu: 0 }],
});

function dengan(ubah: (d: ReturnType<typeof sah>) => void) {
  const d = sah();
  ubah(d);
  return d as unknown as Record<string, unknown>;
}

describe("validasi hasil analisis", () => {
  it("data sah diterima, skor dibulatkan, kolom asing dibuang", () => {
    const hasil = validasiHasil({ ...sah(), kontur: [{ waktu: 1, midi: 61, x: "<script>" }] });
    expect(hasil.sah).toBe(true);
    if (!hasil.sah) return;
    expect(hasil.data.skor).toBe(88);
    expect(hasil.data.kontur).toEqual([{ waktu: 1, midi: 61 }]);
  });

  it("skor di luar 0–100 atau bukan angka ditolak", () => {
    for (const skor of [-1, 100.5, Number.NaN, "90", null]) {
      expect(validasiHasil({ ...sah(), skor }).sah).toBe(false);
    }
  });

  it("midi harus 0–127", () => {
    expect(validasiHasil(dengan((d) => (d.kontur[0].midi = 1e300))).sah).toBe(false);
    expect(validasiHasil(dengan((d) => (d.acuan[0].midi = -1))).sah).toBe(false);
    expect(validasiHasil(dengan((d) => (d.nadaMeleset[0].midiAcuan = 128))).sah).toBe(false);
  });

  it("midi acuan dan nada meleset harus bilangan bulat; midi kontur boleh pecahan atau null", () => {
    expect(validasiHasil(dengan((d) => (d.acuan[0].midi = 60.5))).sah).toBe(false);
    expect(validasiHasil(dengan((d) => (d.nadaMeleset[0].midiAcuan = 60.5))).sah).toBe(false);
    expect(validasiHasil(dengan((d) => (d.kontur[0].midi = 60.37))).sah).toBe(true);
  });

  it("waktu tidak boleh negatif atau lebih dari 300 detik", () => {
    expect(validasiHasil(dengan((d) => (d.kontur[0].waktu = -0.1))).sah).toBe(false);
    expect(validasiHasil(dengan((d) => (d.acuan[0].waktu = 301))).sah).toBe(false);
    expect(validasiHasil(dengan((d) => (d.nadaMeleset[0].waktu = -5))).sah).toBe(false);
    expect(validasiHasil(dengan((d) => (d.acuan[0].waktu = 300))).sah).toBe(true);
  });

  it("durasi nada harus > 0 dan ≤ 60 detik", () => {
    expect(validasiHasil(dengan((d) => (d.acuan[0].durasi = 0))).sah).toBe(false);
    expect(validasiHasil(dengan((d) => (d.acuan[0].durasi = 61))).sah).toBe(false);
    expect(validasiHasil(dengan((d) => (d.acuan[0].durasi = 60))).sah).toBe(true);
  });

  it("selisih cent −2400 sampai 2400 atau null", () => {
    expect(validasiHasil(dengan((d) => (d.nadaMeleset[0].selisihCent = 2401))).sah).toBe(false);
    expect(validasiHasil(dengan((d) => (d.nadaMeleset[0].selisihCent = -2400))).sah).toBe(true);
    expect(validasiHasil(dengan((d) => ((d.nadaMeleset[0] as { selisihCent: number | null }).selisihCent = null))).sah).toBe(true);
  });

  it("urutan harus bilangan bulat ≥ 0", () => {
    expect(validasiHasil(dengan((d) => (d.nadaMeleset[0].urutan = 1.5))).sah).toBe(false);
    expect(validasiHasil(dengan((d) => (d.nadaMeleset[0].urutan = -1))).sah).toBe(false);
  });

  it("kolom wajib yang hilang, null, atau Infinity ditolak", () => {
    expect(validasiHasil(dengan((d) => delete (d.acuan[0] as Partial<typeof d.acuan[0]>).durasi)).sah).toBe(false);
    expect(validasiHasil(dengan((d) => ((d.kontur[0] as { waktu: number | null }).waktu = null))).sah).toBe(false);
    expect(validasiHasil(dengan((d) => (d.kontur[0].waktu = Infinity))).sah).toBe(false);
  });

  it("daftar bukan array, berisi bukan objek, atau terlalu panjang ditolak", () => {
    expect(validasiHasil({ ...sah(), kontur: "x" }).sah).toBe(false);
    expect(validasiHasil({ ...sah(), acuan: [null] }).sah).toBe(false);
    const titik = Array.from({ length: MAKS_TITIK + 1 }, () => ({ waktu: 0, midi: 60 }));
    expect(validasiHasil({ ...sah(), kontur: titik }).sah).toBe(false);
    const nada = Array.from({ length: MAKS_NADA + 1 }, () => ({ midi: 60, waktu: 0, durasi: 0.5 }));
    expect(validasiHasil({ ...sah(), acuan: nada }).sah).toBe(false);
  });
});

describe("galat fungsi sesi", () => {
  it("menerjemahkan galat dari database ke pesan Bahasa Indonesia", () => {
    expect(galatSesi({ code: "P0001", message: "kuota_habis" })).toMatchObject({ status: 403, kode: "kuota_habis" });
    expect(galatSesi({ code: "P0001", message: "sesi_kedaluwarsa" })?.pesan).toMatch(/kedaluwarsa/);
    expect(galatSesi({ code: "P0001", message: "sesi_tidak_ditemukan" })?.status).toBe(404);
    expect(galatSesi({ code: "P0001", message: "sesi_tidak_aktif" })?.status).toBe(409);
    expect(galatSesi({ code: "P0001", message: "sesi_berjalan" })?.status).toBe(409);
  });

  it("migrasi belum dijalankan menjadi 503, bukan 500", () => {
    for (const code of ["PGRST202", "42883", "42703"]) {
      expect(migrasiBelumDijalankan({ code })).toBe(true);
      expect(galatSesi({ code, message: "apa saja" })).toEqual(GALAT_BELUM_SIAP);
    }
    expect(GALAT_BELUM_SIAP.status).toBe(503);
  });

  it("galat tidak dikenal dikembalikan null", () => {
    expect(galatSesi({ code: "23505", message: "duplicate key" })).toBeNull();
    expect(galatSesi({ code: "P0001", message: "constructor" })).toBeNull();
    expect(galatSesi(null)).toBeNull();
  });
});
