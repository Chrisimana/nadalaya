import { describe, expect, it } from "vitest";
import { jalurInternal, sesiPemulihan, SITUS_PENGEMBANGAN, tentukanAlamatSitus } from "@/lib/keamanan";

const BS = "\\";

describe("jalur internal (open redirect)", () => {
  // Nilai seperti yang diterima dari searchParams (sudah di-decode).
  const berbahaya = [
    `/${BS}evil.com`,
    `/${BS}${BS}evil.com`,
    "/\t/evil.com",
    "/\n/evil.com",
    "/\r/evil.com",
    "//evil.com",
    "///evil.com",
    "https://evil.com",
    "http:evil.com",
    "javascript:alert(1)",
    "evil.com",
    "",
  ];

  it.each(berbahaya)("menolak %j", (nilai) => {
    expect(jalurInternal(nilai)).toBe("/dashboard");
  });

  it("menolak bentuk ter-encode setelah di-decode oleh URLSearchParams", () => {
    for (const mentah of ["/%5Cevil.com", "/%09/evil.com", "/%0A/evil.com", "%2F%2Fevil.com"]) {
      const nilai = new URLSearchParams(`next=${mentah}`).get("next");
      expect(jalurInternal(nilai)).toBe("/dashboard");
    }
  });

  it("menerima jalur internal yang sah apa adanya", () => {
    expect(jalurInternal("/dashboard?tab=1")).toBe("/dashboard?tab=1");
    expect(jalurInternal("/latihan/abc?mode=ulang#hasil")).toBe("/latihan/abc?mode=ulang#hasil");
    expect(jalurInternal("/materi")).toBe("/materi");
  });

  it("bukan string atau null memakai cadangan", () => {
    expect(jalurInternal(null)).toBe("/dashboard");
    expect(jalurInternal(undefined, "/masuk")).toBe("/masuk");
    expect(jalurInternal(["/dashboard"])).toBe("/dashboard");
  });
});

describe("sesi pemulihan kata sandi", () => {
  const SEKARANG = new Date("2026-10-27T10:00:00Z");
  const detik = (menitLalu: number) => SEKARANG.getTime() / 1000 - menitLalu * 60;

  it("sesi dari tautan email yang masih baru diterima", () => {
    expect(sesiPemulihan([{ method: "recovery", timestamp: detik(2) }], SEKARANG)).toBe(true);
    expect(sesiPemulihan([{ method: "otp", timestamp: detik(29) }], SEKARANG)).toBe(true);
  });

  it("sesi login dengan kata sandi ditolak", () => {
    expect(sesiPemulihan([{ method: "password", timestamp: detik(1) }], SEKARANG)).toBe(false);
  });

  it("sesi pemulihan lebih dari 30 menit ditolak", () => {
    expect(sesiPemulihan([{ method: "recovery", timestamp: detik(31) }], SEKARANG)).toBe(false);
  });

  it("amr kosong, rusak, atau format string ditolak", () => {
    expect(sesiPemulihan(undefined, SEKARANG)).toBe(false);
    expect(sesiPemulihan([], SEKARANG)).toBe(false);
    expect(sesiPemulihan(["otp"], SEKARANG)).toBe(false);
    expect(sesiPemulihan([{ method: "recovery" }], SEKARANG)).toBe(false);
  });
});

describe("alamat situs untuk tautan email", () => {
  it("pengembangan tanpa nilai memakai localhost:3000", () => {
    expect(tentukanAlamatSitus(undefined, false)).toBe(SITUS_PENGEMBANGAN);
    expect(tentukanAlamatSitus("  ", false)).toBe(SITUS_PENGEMBANGAN);
  });

  it("produksi tanpa nilai gagal", () => {
    expect(() => tentukanAlamatSitus(undefined, true)).toThrow(/wajib diisi/);
    expect(() => tentukanAlamatSitus("", true)).toThrow(/wajib diisi/);
  });

  it("nilai diisi dipakai tanpa garis miring di akhir", () => {
    expect(tentukanAlamatSitus("https://nadalaya.onrender.com/", true)).toBe("https://nadalaya.onrender.com");
    expect(tentukanAlamatSitus("http://localhost:3000", true)).toBe("http://localhost:3000");
  });

  it("nilai yang bukan URL http(s) ditolak", () => {
    expect(() => tentukanAlamatSitus("nadalaya.onrender.com", true)).toThrow(/URL lengkap/);
    expect(() => tentukanAlamatSitus("javascript:alert(1)", true)).toThrow(/http/);
  });
});
