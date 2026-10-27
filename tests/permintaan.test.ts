import { describe, expect, it } from "vitest";
import { GalatRute } from "@/lib/galatRute";
import { batasi, formatTunggu, Pembatas } from "@/lib/pembatas";
import {
  BATAS_FORM_MIDI,
  bacaTeksTerbatas,
  ipKlien,
  ringkasGalat,
  wajibAsalSama,
  wajibJson,
  wajibUkuranForm,
} from "@/lib/permintaan";

const ALAMAT = "http://localhost:3000/api/uji";

function streamDari(bagian: string[]) {
  const enc = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(c) {
      bagian.forEach((b) => c.enqueue(enc.encode(b)));
      c.close();
    },
  });
}

async function galatDari(janji: Promise<unknown> | (() => unknown)) {
  try {
    await (typeof janji === "function" ? janji() : janji);
  } catch (err) {
    return err as GalatRute;
  }
  throw new Error("seharusnya gagal");
}

describe("batas ukuran body", () => {
  it("body kecil terbaca utuh", async () => {
    const req = new Request(ALAMAT, { method: "POST", body: '{"a":1}' });
    expect(await bacaTeksTerbatas(req, 16)).toBe('{"a":1}');
  });

  it("Content-Length di atas batas ditolak 413 sebelum body dibaca", async () => {
    const req = new Request(ALAMAT, {
      method: "POST",
      body: "x".repeat(10),
      headers: { "content-length": String(20 * 1024) },
    });
    const galat = await galatDari(bacaTeksTerbatas(req, 16 * 1024));
    expect(galat.status).toBe(413);
    expect(req.bodyUsed).toBe(false);
  });

  it("body streaming tanpa Content-Length dihentikan begitu melewati batas", async () => {
    const req = new Request(ALAMAT, {
      method: "POST",
      body: streamDari(["x".repeat(10), "x".repeat(10), "x".repeat(10)]),
      duplex: "half",
    } as RequestInit);
    const galat = await galatDari(bacaTeksTerbatas(req, 25));
    expect(galat).toBeInstanceOf(GalatRute);
    expect(galat.status).toBe(413);
  });

  it("body streaming tepat di batas tetap diterima, termasuk karakter multibyte", async () => {
    const req = new Request(ALAMAT, {
      method: "POST",
      body: streamDari(["é".repeat(5)]),
      duplex: "half",
    } as RequestInit);
    expect(await bacaTeksTerbatas(req, 10)).toBe("ééééé");
  });

  it("unggah MIDI: Content-Length wajib dan maksimal ±1,2 MB", async () => {
    const tanpa = new Request(ALAMAT, { method: "POST" });
    expect((await galatDari(() => wajibUkuranForm(tanpa, BATAS_FORM_MIDI))).status).toBe(411);
    const besar = new Request(ALAMAT, { method: "POST", headers: { "content-length": String(BATAS_FORM_MIDI + 1) } });
    expect((await galatDari(() => wajibUkuranForm(besar, BATAS_FORM_MIDI))).status).toBe(413);
    const pas = new Request(ALAMAT, { method: "POST", headers: { "content-length": String(BATAS_FORM_MIDI) } });
    expect(() => wajibUkuranForm(pas, BATAS_FORM_MIDI)).not.toThrow();
  });
});

describe("Content-Type dan Origin (CSRF)", () => {
  const dengan = (method: string, header: Record<string, string>) => new Request(ALAMAT, { method, headers: header });

  it("hanya application/json yang diterima", async () => {
    expect(() => wajibJson(dengan("POST", { "content-type": "application/json; charset=utf-8" }))).not.toThrow();
    for (const jenis of ["text/plain", "application/x-www-form-urlencoded", "multipart/form-data"]) {
      expect((await galatDari(() => wajibJson(dengan("POST", { "content-type": jenis })))).status).toBe(415);
    }
    expect((await galatDari(() => wajibJson(dengan("POST", {})))).status).toBe(415);
  });

  it("POST dari situs lain ditolak; situs sendiri, tanpa Origin, dan GET dilewatkan", async () => {
    const situs = "https://nadalaya.onrender.com";
    expect((await galatDari(() => wajibAsalSama(dengan("POST", { origin: "https://evil.com" }), () => situs))).status).toBe(403);
    expect((await galatDari(() => wajibAsalSama(dengan("DELETE", { origin: "null" }), () => situs))).status).toBe(403);
    expect(() => wajibAsalSama(dengan("POST", { origin: situs }), () => situs)).not.toThrow();
    expect(() => wajibAsalSama(dengan("PATCH", {}), () => situs)).not.toThrow();
    expect(() => wajibAsalSama(dengan("GET", { origin: "https://evil.com" }), () => situs)).not.toThrow();
  });
});

describe("IP klien", () => {
  it("memakai nilai pertama x-forwarded-for", () => {
    expect(ipKlien(new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe("203.0.113.7");
    expect(ipKlien(new Headers({ "x-forwarded-for": " 2001:db8::1 " }))).toBe("2001:db8::1");
  });

  it("nilai kosong atau tidak sah memakai x-real-ip lalu fallback", () => {
    expect(ipKlien(new Headers({ "x-forwarded-for": ", 10.0.0.1", "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
    expect(ipKlien(new Headers({ "x-forwarded-for": "<script>" }))).toBe("tidak-diketahui");
    expect(ipKlien(new Headers())).toBe("tidak-diketahui");
  });
});

describe("pembatas percobaan", () => {
  function jamPalsu(awal = 0) {
    let t = awal;
    return { jam: () => t, maju: (ms: number) => (t += ms) };
  }

  it("mengizinkan sampai batas, lalu menolak dengan waktu tunggu", () => {
    const j = jamPalsu();
    const p = new Pembatas(5, 15 * 60_000, j.jam);
    for (let i = 0; i < 5; i++) {
      expect(p.tunggu("a@contoh.com")).toBe(0);
      p.catat("a@contoh.com");
    }
    expect(p.tunggu("a@contoh.com")).toBe(15 * 60);
    j.maju(10 * 60_000);
    expect(p.tunggu("a@contoh.com")).toBe(5 * 60);
  });

  it("jendela geser: percobaan lama berhenti dihitung", () => {
    const j = jamPalsu();
    const p = new Pembatas(2, 60_000, j.jam);
    p.catat("k");
    j.maju(30_000);
    p.catat("k");
    expect(p.tunggu("k")).toBe(30);
    j.maju(30_001);
    expect(p.tunggu("k")).toBe(0);
  });

  it("kunci berbeda dihitung terpisah dan catatan kedaluwarsa dibersihkan", () => {
    const j = jamPalsu();
    const p = new Pembatas(1, 1000, j.jam);
    p.catat("x");
    expect(p.tunggu("y")).toBe(0);
    j.maju(2000);
    expect(p.tunggu("x")).toBe(0);
    expect(p.ukuran).toBe(0);
  });

  it("batasi(): 429 dengan pesan dan Retry-After; tidak mencatat bila ditolak", async () => {
    const j = jamPalsu();
    const perIp = new Pembatas(20, 15 * 60_000, j.jam);
    const perEmail = new Pembatas(5, 15 * 60_000, j.jam);
    for (let i = 0; i < 5; i++) batasi([[perIp, "1.2.3.4"], [perEmail, "a@contoh.com"]]);

    const galat = await galatDari(() => batasi([[perIp, "1.2.3.4"], [perEmail, "a@contoh.com"]]));
    expect(galat.status).toBe(429);
    expect(galat.kode).toBe("terlalu_sering");
    expect(galat.message).toBe("Terlalu banyak percobaan. Silakan coba lagi dalam 15 menit.");
    expect(galat.header).toEqual({ "Retry-After": String(15 * 60) });

    // Percobaan yang ditolak tidak menghabiskan jatah IP untuk email lain.
    for (let i = 0; i < 15; i++) batasi([[perIp, "1.2.3.4"], [perEmail, `lain${i}@contoh.com`]]);
    expect((await galatDari(() => batasi([[perIp, "1.2.3.4"], [perEmail, "baru@contoh.com"]]))).status).toBe(429);
  });

  it("format waktu tunggu", () => {
    expect(formatTunggu(45)).toBe("45 detik");
    expect(formatTunggu(61)).toBe("2 menit");
    expect(formatTunggu(3540)).toBe("59 menit");
    expect(formatTunggu(3600)).toBe("1 jam");
  });
});

describe("log galat", () => {
  it("galat database hanya dicatat kode dan pesan", () => {
    const galat = { code: "23505", message: "duplicate key", details: "Key (email)=(rahasia@contoh.com)", hint: null };
    const log = ringkasGalat(galat);
    expect(log).toBe("23505 duplicate key");
    expect(log).not.toContain("rahasia@contoh.com");
  });

  it("galat program tetap menyertakan stack", () => {
    expect(ringkasGalat(new TypeError("x is undefined"))).toContain("TypeError: x is undefined");
  });
});
