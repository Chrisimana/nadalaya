import { readdirSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { analisisKontur } from "@/lib/audio/analisis";
import { NadaTidakTerdeteksiError } from "@/lib/audio/crepe";
import { DURASI_MAKS, DURASI_MIN } from "@/lib/audio/recorder";
import { batalkanSesiAnalisis, mulaiSesiAnalisis, simpanRiwayat } from "@/lib/api";
import { galatSesi } from "@/lib/sesiAnalisis";
import type { HasilAnalisis } from "@/lib/types";
import { konturSintetis, nadaDariMidi } from "./bantuan";

const MATERI = readdirSync(join(process.cwd(), "scripts", "midi")).filter((f) => f.endsWith(".mid"));

describe("NFR-03 akurasi: tepat ≥ 80, meleset 1 semiton ≤ 50 untuk setiap materi bawaan", () => {
  it.each(MATERI)("%s", (berkas) => {
    const acuan = nadaDariMidi(berkas);
    expect(analisisKontur(konturSintetis(acuan, { jitter: 0.1 }), acuan).skor).toBeGreaterThanOrEqual(80);
    expect(analisisKontur(konturSintetis(acuan, { geser: 1 }), acuan).skor).toBeLessThanOrEqual(50);
    expect(analisisKontur(konturSintetis(acuan, { geser: -1 }), acuan).skor).toBeLessThanOrEqual(50);
  });
});

describe("NFR-07 privasi: rekaman tidak dikirim ke server", () => {
  const permintaan: { url: string; init: RequestInit }[] = [];

  function tiruFetch(jawaban: unknown) {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init: RequestInit) => {
        permintaan.push({ url, init });
        return new Response(JSON.stringify(jawaban), { status: 200, headers: { "Content-Type": "application/json" } });
      }),
    );
  }

  afterEach(() => {
    vi.unstubAllGlobals();
    permintaan.length = 0;
  });

  it("alur analisis hanya mengirim JSON tanpa audio", async () => {
    tiruFetch({ sesiId: "s1", riwayatId: "r1" });
    const hasil = {
      skor: 90,
      kontur: [{ waktu: 0, midi: 60 }],
      acuan: [{ midi: 60, waktu: 0, durasi: 0.5 }],
      nadaMeleset: [],
      // Properti tambahan yang tidak boleh ikut terkirim.
      rekaman: new Blob([new Uint8Array(1000)], { type: "audio/webm" }),
    } as unknown as HasilAnalisis;

    await mulaiSesiAnalisis("materi-1");
    await simpanRiwayat({ sesiId: "s1", hasil });
    await batalkanSesiAnalisis("s1");

    for (const { init } of permintaan) {
      expect(init.body === undefined || typeof init.body === "string").toBe(true);
      expect(String(init.body ?? "")).not.toMatch(/audio|webm|rekaman|blob/i);
    }
    expect(JSON.parse(String(permintaan[1].init.body))).toEqual({
      skor: 90,
      kontur: [{ waktu: 0, midi: 60 }],
      acuan: [{ midi: 60, waktu: 0, durasi: 0.5 }],
      nadaMeleset: [],
    });
  });
});

describe("NFR-09 keandalan: analisis gagal memberi pesan jelas", () => {
  const acuan = nadaDariMidi("do-mayor.mid");

  it("rekaman hening atau hampir tanpa suara → nada tidak terdeteksi", () => {
    const hening = Array.from({ length: 500 }, (_, i) => ({ waktu: i / 100, midi: null }));
    expect(() => analisisKontur(hening, acuan)).toThrow(NadaTidakTerdeteksiError);
  });

  it("rekaman terlalu pendek dibanding acuan → nada tidak terdeteksi", () => {
    const pendek = konturSintetis(acuan.slice(0, 1));
    expect(() => analisisKontur(pendek, acuan)).toThrow(NadaTidakTerdeteksiError);
  });

  it("batas rekaman 2–60 detik sesuai kebutuhan", () => {
    expect(DURASI_MIN).toBe(2);
    expect(DURASI_MAKS).toBe(60);
  });
});

describe("NFR-11 bahasa: pesan galat server berbahasa Indonesia", () => {
  it.each(["kuota_habis", "sesi_kedaluwarsa", "sesi_tidak_ditemukan", "materi_premium", "akun_nonaktif"])("%s", (kode) => {
    const pesan = galatSesi({ code: "P0001", message: kode })?.pesan ?? "";
    expect(pesan.length).toBeGreaterThan(10);
    expect(pesan).not.toMatch(/\b(error|failed|not found|session|quota)\b/i);
  });
});
