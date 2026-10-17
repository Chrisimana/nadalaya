/*
 * Uji cepat fungsi murni dengan deret nada sintetis (tanpa CREPE).
 */
import { describe, expect, it } from "vitest";
import { analisisKontur } from "@/lib/audio/analisis";
import { NadaTidakTerdeteksiError } from "@/lib/audio/crepe";
import { deretAcuan, dtw, geserOktaf, turunkanResolusi } from "@/lib/audio/dtw";
import { susunBirama } from "@/lib/audio/notasi";
import { skorAkhir, skorNada } from "@/lib/audio/skor";
import type { NadaAcuan, TitikPitch } from "@/lib/types";
import { nadaDariMidi } from "./bantuan";

/** Kontur CREPE tiruan 100 bingkai/detik dari deret nada. */
function konturSintetis(
  nada: NadaAcuan[],
  opsi: { geser?: number; tempo?: number; jitter?: number; awal?: number } = {},
): TitikPitch[] {
  const { geser = 0, tempo = 1, jitter = 0, awal = 0.5 } = opsi;
  const akhir = Math.max(...nada.map((n) => n.waktu + n.durasi)) * tempo + 2 * awal;
  const hasil: TitikPitch[] = [];
  for (let f = 0; f < akhir * 100; f++) {
    const t = f / 100;
    const asli = (t - awal) / tempo;
    const n = nada.find((x) => asli >= x.waktu && asli < x.waktu + x.durasi);
    hasil.push({ waktu: t, midi: n ? n.midi + geser + (f % 2 ? jitter : -jitter) : null });
  }
  return hasil;
}

const doMayor = nadaDariMidi("do-mayor.mid");

describe("skor", () => {
  it("skor penuh hingga 20 cent, lalu turun linear hingga 0 pada 100 cent", () => {
    expect(skorNada(0)).toBe(100);
    expect(skorNada(20)).toBe(100);
    expect(skorNada(-20)).toBe(100);
    expect(skorNada(60)).toBe(50);
    expect(skorNada(-50)).toBeCloseTo(62.5);
    expect(skorNada(100)).toBe(0);
    expect(skorNada(150)).toBe(0);
    expect(skorNada(null)).toBe(0);
    expect(skorAkhir([10, 60, null])).toBe(50);
  });
});

describe("DTW dan toleransi oktaf", () => {
  it("geser oktaf memilih kelipatan 12 terdekat", () => {
    expect(geserOktaf([48, 50, 52], [60, 62, 64])).toBe(-12);
    expect(geserOktaf([85, 86], [60, 62])).toBe(24);
    expect(geserOktaf([61, 63], [60, 62])).toBe(0);
  });

  it("DTW memetakan deret yang diregangkan ke deret aslinya", () => {
    const jalur = dtw([1, 2, 3], [1, 1, 2, 2, 3, 3]);
    expect(jalur[0]).toEqual([0, 0]);
    expect(jalur.at(-1)).toEqual([2, 5]);
    for (const [i, j] of jalur) expect([1, 2, 3][i]).toBe([1, 1, 2, 2, 3, 3][j]);
  });

  it("deret acuan dan penurunan resolusi ke 20 bingkai/detik", () => {
    expect(deretAcuan([{ midi: 60, waktu: 0, durasi: 0.5 }])).toHaveLength(10);
    const turun = turunkanResolusi(konturSintetis([{ midi: 60, waktu: 0, durasi: 1 }], { awal: 0 }));
    expect(turun).toHaveLength(20);
    expect(turun.every((b) => b.midi === 60)).toBe(true);
  });
});

describe("analisis kontur sintetis (do-mayor.mid)", () => {
  it("tepat dengan sedikit getaran → ≥ 80", () => {
    expect(analisisKontur(konturSintetis(doMayor, { jitter: 0.1 }), doMayor).skor).toBeGreaterThanOrEqual(80);
  });

  it("tempo lebih lambat 20% tetap ≥ 80 berkat DTW", () => {
    expect(analisisKontur(konturSintetis(doMayor, { tempo: 1.2 }), doMayor).skor).toBeGreaterThanOrEqual(80);
  });

  it("bergeser 1 semiton → ≤ 50", () => {
    expect(analisisKontur(konturSintetis(doMayor, { geser: 1 }), doMayor).skor).toBeLessThanOrEqual(50);
  });

  it("dua oktaf lebih tinggi → ≥ 80", () => {
    expect(analisisKontur(konturSintetis(doMayor, { geser: 24 }), doMayor).skor).toBeGreaterThanOrEqual(80);
  });

  it("bingkai bersuara < 20% → nada tidak terdeteksi", () => {
    const kontur = konturSintetis(doMayor).map((t, i) => (i % 10 === 0 ? t : { ...t, midi: null }));
    expect(() => analisisKontur(kontur, doMayor)).toThrow(NadaTidakTerdeteksiError);
  });
});

describe("notasi", () => {
  it("do-mayor.mid tersusun menjadi birama 4/4 penuh", () => {
    const birama = susunBirama(doMayor, 90);
    expect(birama.length).toBe(4);
    for (const b of birama) expect(b.reduce((s, t) => s + t.ketukan, 0)).toBe(4);
    const not = birama.flat().filter((t) => t.midi !== null);
    expect(not).toHaveLength(15);
    expect(not.every((t) => t.ketukan === 1)).toBe(true);
  });

  it("not yang melewati garis birama dipecah dan disambung", () => {
    const birama = susunBirama([{ midi: 60, waktu: 3 * 0.5, durasi: 2 * 0.5 }], 120);
    expect(birama[0].at(-1)).toMatchObject({ midi: 60, ketukan: 1, sambung: true });
    expect(birama[1][0]).toMatchObject({ midi: 60, ketukan: 1, sambung: false });
  });
});
