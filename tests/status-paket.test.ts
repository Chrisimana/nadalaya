import { describe, expect, it } from "vitest";
import { bolehUjiCoba, labelSisaHari, ringkasPaket, sisaHari } from "@/lib/statusPaket";

const SEKARANG = new Date("2026-10-23T10:00:00Z");
const JAM = 60 * 60 * 1000;
const tambah = (ms: number) => new Date(SEKARANG.getTime() + ms).toISOString();

describe("sisa hari", () => {
  it("tepat 7 hari setelah aktivasi → 7", () => {
    expect(sisaHari(tambah(7 * 24 * JAM), SEKARANG)).toBe(7);
  });

  it("dibulatkan ke atas: 6 hari 1 jam → 7, 2 jam → 1", () => {
    expect(sisaHari(tambah(6 * 24 * JAM + JAM), SEKARANG)).toBe(7);
    expect(sisaHari(tambah(2 * JAM), SEKARANG)).toBe(1);
  });

  it("sudah lewat → 0, tanpa masa berlaku → null", () => {
    expect(sisaHari(tambah(-JAM), SEKARANG)).toBe(0);
    expect(sisaHari(null, SEKARANG)).toBeNull();
  });

  it("label sisa hari", () => {
    expect(labelSisaHari(3)).toBe("Sisa 3 hari");
    expect(labelSisaHari(0)).toBe("Sudah berakhir");
    expect(labelSisaHari(null)).toBeNull();
  });
});

describe("ringkasan status paket", () => {
  it("Gratis tanpa masa berlaku", () => {
    expect(ringkasPaket({ statusPaket: "gratis", tanggalBerakhir: null }, SEKARANG)).toEqual({
      judul: "Gratis",
      keterangan: "Tanpa masa berlaku",
      sisaHari: null,
    });
  });

  it("Uji coba menampilkan tanggal berakhir dalam WIB dan sisa hari", () => {
    // 30 Oktober 2026 17.30 UTC = 31 Oktober 2026 00.30 WIB.
    const hasil = ringkasPaket(
      { statusPaket: "uji_coba", tanggalBerakhir: "2026-10-30T17:30:00Z" },
      SEKARANG,
    );
    expect(hasil.judul).toBe("Uji Coba Premium");
    expect(hasil.keterangan).toBe("Uji Coba Premium, berakhir 31 Oktober 2026, 00.30 WIB");
    expect(hasil.sisaHari).toBe(8);
  });

  it("Premium menampilkan label Premium", () => {
    const hasil = ringkasPaket({ statusPaket: "premium", tanggalBerakhir: tambah(30 * 24 * JAM) }, SEKARANG);
    expect(hasil.keterangan).toMatch(/^Premium, berakhir /);
    expect(hasil.sisaHari).toBe(30);
  });
});

describe("hak uji coba", () => {
  it("hanya Gratis yang belum pernah uji coba", () => {
    expect(bolehUjiCoba({ statusPaket: "gratis", ujiCobaDigunakan: false })).toBe(true);
    expect(bolehUjiCoba({ statusPaket: "gratis", ujiCobaDigunakan: true })).toBe(false);
    expect(bolehUjiCoba({ statusPaket: "uji_coba", ujiCobaDigunakan: true })).toBe(false);
    expect(bolehUjiCoba({ statusPaket: "premium", ujiCobaDigunakan: false })).toBe(false);
  });
});
