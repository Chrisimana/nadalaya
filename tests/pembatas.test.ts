import { afterEach, describe, expect, it, vi } from "vitest";
import type { GalatRute } from "@/lib/galatRute";
import {
  argumenCatatPercobaan,
  batasiDengan,
  buatPencatatSupabase,
  kunciTersamar,
  Pembatas,
  PEMBATAS,
  type PencatatPercobaan,
  type Percobaan,
} from "@/lib/pembatas";

async function galatDari(fn: () => Promise<unknown>) {
  try {
    await fn();
  } catch (err) {
    return err as GalatRute;
  }
  throw new Error("seharusnya gagal");
}

type Rpc = (fungsi: string, argumen: unknown) => Promise<{ data: unknown; error: { code?: string; message?: string } | null }>;

afterEach(() => vi.restoreAllMocks());

describe("pembatas bersama", () => {
  it("kunci disamarkan dan dipisah per aturan", () => {
    const a = kunciTersamar("masuk-email", "a@contoh.com");
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).toBe(kunciTersamar("masuk-email", "a@contoh.com"));
    expect(a).not.toBe(kunciTersamar("daftar-email", "a@contoh.com"));
    expect(a).not.toContain("contoh");
  });

  it("nama aturan unik", () => {
    const nama = Object.values(PEMBATAS).map((p) => p.nama);
    expect(new Set(nama).size).toBe(nama.length);
  });

  it("argumen fungsi database memuat batas dan jendela dalam detik", () => {
    const daftar: Percobaan[] = [
      { pembatas: PEMBATAS.masukIp, kunci: "203.0.113.7" },
      { pembatas: PEMBATAS.masukEmail, kunci: "a@contoh.com" },
    ];
    expect(argumenCatatPercobaan(daftar)).toEqual({
      p_kunci: [kunciTersamar("masuk-ip", "203.0.113.7"), kunciTersamar("masuk-email", "a@contoh.com")],
      p_batas: [20, 5],
      p_jendela_detik: [900, 900],
    });
  });

  it("memakai hasil penyimpanan bersama dan tidak mencatat di memori", async () => {
    const p = new Pembatas("uji", 1, 60_000);
    const pencatat = vi.fn<PencatatPercobaan>(async () => 0);
    await batasiDengan([[p, "k"], [p, null]], pencatat);
    await batasiDengan([[p, "k"]], pencatat);
    expect(pencatat).toHaveBeenCalledTimes(2);
    expect(pencatat.mock.calls[0][0]).toEqual([{ pembatas: p, kunci: "k" }]);
    expect(p.ukuran).toBe(0);
  });

  it("waktu tunggu dari penyimpanan bersama menjadi 429 dengan pesan yang sama", async () => {
    const p = new Pembatas("uji", 5, 15 * 60_000);
    const galat = await galatDari(() => batasiDengan([[p, "k"]], async () => 600));
    expect(galat.status).toBe(429);
    expect(galat.kode).toBe("terlalu_sering");
    expect(galat.message).toBe("Terlalu banyak percobaan. Silakan coba lagi dalam 10 menit.");
    expect(galat.header).toEqual({ "Retry-After": "600" });
  });

  it("tanpa kunci, penyimpanan bersama tidak dipanggil", async () => {
    const pencatat = vi.fn(async () => 0);
    await batasiDengan([[new Pembatas("uji", 1, 1000), ""]], pencatat);
    expect(pencatat).not.toHaveBeenCalled();
  });

  it("migrasi belum dijalankan: memakai memori dan memperingatkan sekali", async () => {
    const peringatan = vi.spyOn(console, "warn").mockImplementation(() => {});
    const rpc = vi.fn<Rpc>(async () => ({ data: null, error: { code: "PGRST202", message: "Could not find the function" } }));
    const pencatat = buatPencatatSupabase(rpc);
    const p = new Pembatas("uji", 2, 60_000);

    await batasiDengan([[p, "k"]], pencatat);
    await batasiDengan([[p, "k"]], pencatat);
    expect((await galatDari(() => batasiDengan([[p, "k"]], pencatat))).status).toBe(429);

    expect(rpc).toHaveBeenCalledTimes(3);
    expect(rpc.mock.calls[0][0]).toBe("catat_percobaan");
    expect(peringatan).toHaveBeenCalledTimes(1);
    expect(String(peringatan.mock.calls[0][0])).toContain("migrasi-05-pembatas.sql");
  });

  it("galat jaringan atau kunci rahasia hilang: memakai memori tanpa membocorkan kunci", async () => {
    const peringatan = vi.spyOn(console, "warn").mockImplementation(() => {});
    const pencatat = buatPencatatSupabase(() => {
      throw new Error("SUPABASE_SECRET_KEY belum diisi di .env.local.");
    });
    const p = new Pembatas("uji", 1, 60_000);
    await batasiDengan([[p, "a@contoh.com"]], pencatat);
    expect(p.ukuran).toBe(1);
    expect(peringatan).toHaveBeenCalledTimes(1);
    expect(String(peringatan.mock.calls[0][0])).not.toContain("a@contoh.com");
  });

  it("hasil database dipakai apa adanya", async () => {
    const rpc = vi.fn(async () => ({ data: 0, error: null }));
    expect(await buatPencatatSupabase(rpc)([{ pembatas: PEMBATAS.sesiPengguna, kunci: "uid" }])).toBe(0);
    rpc.mockResolvedValueOnce({ data: 42, error: null });
    expect(await buatPencatatSupabase(rpc)([{ pembatas: PEMBATAS.sesiPengguna, kunci: "uid" }])).toBe(42);
  });
});
