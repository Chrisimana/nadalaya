import { describe, expect, it } from "vitest";
import { analisisKontur } from "@/lib/audio/analisis";
import { NadaTidakTerdeteksiError } from "@/lib/audio/crepe";
import { deretAcuan, dtw, geserOktaf, lebarPitaBawaan, turunkanResolusi } from "@/lib/audio/dtw";
import { bersihkanKontur, hapusLonjakanSingkat } from "@/lib/audio/kontur";
import { susunBirama } from "@/lib/audio/notasi";
import { skorAkhir, skorNada } from "@/lib/audio/skor";
import type { NadaAcuan, TitikPitch } from "@/lib/types";
import { nadaDariMidi } from "./bantuan";

function konturSintetis(
  nada: NadaAcuan[],
  opsi: { geser?: number; tempo?: number; jitter?: number; awal?: number; jeda?: number } = {},
): TitikPitch[] {
  // tempo = pengali durasi (0,77 = lebih cepat); jeda = detik tanpa suara di awal tiap nada.
  const { geser = 0, tempo = 1, jitter = 0, awal = 0.5, jeda = 0 } = opsi;
  const akhir = Math.max(...nada.map((n) => n.waktu + n.durasi)) * tempo + 2 * awal;
  const hasil: TitikPitch[] = [];
  for (let f = 0; f < akhir * 100; f++) {
    const t = f / 100;
    const asli = (t - awal) / tempo;
    const n = nada.find((x) => asli >= x.waktu && asli < x.waktu + x.durasi);
    const bersuara = n && (asli - n.waktu) * tempo >= jeda;
    hasil.push({ waktu: t, midi: bersuara ? n.midi + geser + (f % 2 ? jitter : -jitter) : null });
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

  it("subsequence DTW memasang seluruh acuan ke sebagian nyanyian saja", () => {
    const acuan = [1, 2, 3];
    const nyanyian = [9, 9, 1, 1, 2, 2, 3, 3, 9, 9];
    const jalur = dtw(acuan, nyanyian);
    expect(jalur[0][0]).toBe(0);
    expect(jalur.at(-1)![0]).toBe(2);
    for (const [i, j] of jalur) expect(acuan[i]).toBe(nyanyian[j]);
  });

  it("deret acuan dan penurunan resolusi ke 20 bingkai/detik", () => {
    expect(deretAcuan([{ midi: 60, waktu: 0, durasi: 0.5 }])).toHaveLength(10);
    const turun = turunkanResolusi(konturSintetis([{ midi: 60, waktu: 0, durasi: 1 }], { awal: 0 }));
    expect(turun).toHaveLength(20);
    expect(turun.every((b) => b.midi === 60)).toBe(true);
  });

  it("bingkai tanpa suara tetap ada sebagai jeda agar skala waktu utuh", () => {
    const kontur: TitikPitch[] = Array.from({ length: 100 }, (_, i) => ({
      waktu: i / 100,
      midi: i >= 40 && i < 60 ? null : 60,
    }));
    const turun = turunkanResolusi(kontur);
    expect(turun).toHaveLength(20);
    expect(turun.slice(8, 12).every((b) => b.midi === null)).toBe(true);
  });

  it("lebar pita melebar saat nyanyian lebih pendek dari acuan", () => {
    expect(lebarPitaBawaan(200, 400)).toBe(100);
    expect(lebarPitaBawaan(200, 80)).toBe(140);
  });
});

describe("pembersihan kontur", () => {
  const datar = (midi: (i: number) => number | null, n = 100): TitikPitch[] =>
    Array.from({ length: n }, (_, i) => ({ waktu: i / 100, midi: midi(i) }));

  it("lonjakan singkat yang kembali ke nada semula dihapus", () => {
    const hasil = hapusLonjakanSingkat(datar((i) => (i >= 45 && i < 53 ? 52 : 69)));
    expect(hasil.slice(45, 53).every((t) => t.midi === null)).toBe(true);
    expect(hasil.filter((t) => t.midi !== null).every((t) => t.midi === 69)).toBe(true);
  });

  it("perpindahan nada yang sah tidak dihapus", () => {
    expect(hapusLonjakanSingkat(datar((i) => (i < 50 ? 60 : 67))).every((t) => t.midi !== null)).toBe(true);
    // Nada singkat di antara dua nada berbeda (C4 → G4 0,1 dtk → E4) juga tetap utuh.
    expect(
      hapusLonjakanSingkat(datar((i) => (i < 45 ? 60 : i < 55 ? 67 : 64))).every((t) => t.midi !== null),
    ).toBe(true);
  });

  it("nada lebih lama dari 0,12 detik tidak dianggap lonjakan", () => {
    expect(hapusLonjakanSingkat(datar((i) => (i >= 40 && i < 60 ? 52 : 69))).every((t) => t.midi !== null)).toBe(true);
  });

  it("median filter meratakan bingkai tunggal yang menyimpang", () => {
    const hasil = bersihkanKontur(datar((i) => (i === 50 ? 62 : 60)));
    expect(hasil.every((t) => t.midi === 60)).toBe(true);
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

  it("rekaman 49 detik dengan materi di awal lalu nyanyian lain → ≥ 80", () => {
    const sisa = Array.from({ length: 39 / 0.5 }, (_, i) => ({
      midi: 55 + ((i * 7) % 20),
      waktu: 10.5 + i * 0.5,
      durasi: 0.45,
    }));
    const kontur = konturSintetis([...doMayor, ...sisa.map((n) => ({ ...n, waktu: n.waktu - 0.5 }))]);
    expect(analisisKontur(kontur, doMayor).skor).toBeGreaterThanOrEqual(80);
  });

  it("lonjakan oktaf singkat dikoreksi → ≥ 80", () => {
    const kontur = konturSintetis(doMayor).map((t, i) =>
      i >= 400 && i < 406 && t.midi !== null ? { ...t, midi: t.midi + 12 } : t,
    );
    expect(analisisKontur(kontur, doMayor).skor).toBeGreaterThanOrEqual(80);
  });

  it("1,3× lebih cepat dengan jeda tanpa suara di awal tiap nada → ≥ 80, nada akhir terbaca", () => {
    const hasil = analisisKontur(konturSintetis(doMayor, { tempo: 1 / 1.3, jeda: 0.12 }), doMayor);
    expect(hasil.skor).toBeGreaterThanOrEqual(80);
    expect(hasil.nadaMeleset).toEqual([]);
  });

  it("0,8× (lebih lambat) dengan jeda tanpa suara → ≥ 80", () => {
    expect(analisisKontur(konturSintetis(doMayor, { tempo: 1 / 0.8, jeda: 0.12 }), doMayor).skor).toBeGreaterThanOrEqual(80);
  });

  it("lonjakan singkat bukan oktaf (G4 → E3 → G4) tidak tampil di kontur", () => {
    // Bingkai 360–367 (0,08 dtk) berada di tengah nada ke-5 (G4).
    const kontur = konturSintetis(doMayor).map((t, i) => (i >= 360 && i < 368 ? { ...t, midi: 52 } : t));
    const hasil = analisisKontur(kontur, doMayor);
    expect(hasil.skor).toBeGreaterThanOrEqual(80);
    const bingkai = deretAcuan(doMayor);
    hasil.kontur.forEach((t, i) => {
      if (t.midi !== null) expect(Math.abs(t.midi - bingkai[i].midi)).toBeLessThan(3);
    });
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

describe("waktu analisis", () => {
  it("penyelarasan dan skor untuk rekaman 30 detik selesai jauh di bawah 1 detik", () => {
    const kontur: TitikPitch[] = Array.from({ length: 3000 }, (_, f) => {
      const t = f / 100;
      const n = doMayor.find((x) => t - 0.5 >= x.waktu && t - 0.5 < x.waktu + x.durasi);
      return { waktu: t, midi: n ? n.midi : t > 11 && f % 50 > 5 ? 55 + (Math.floor(f / 50) % 20) : null };
    });
    const t0 = performance.now();
    const hasil = analisisKontur(kontur, doMayor);
    const ms = performance.now() - t0;
    console.info(`analisisKontur 30 dtk: ${ms.toFixed(1)} ms`);
    expect(hasil.skor).toBeGreaterThanOrEqual(80);
    expect(ms).toBeLessThan(500);
  });
});
