/*
 * Uji ujung ke ujung tanpa mikrofon: audio sinus sintetis dari MIDI seed
 * → CREPE (tfjs, backend cpu) → DTW → skor (NFR-03).
 *
 * Backend cpu di Node jauh lebih lambat daripada WebGL di browser, jadi
 * uji ini memakai hop 50 ms (bukan 10 ms). Alur dan fungsinya tetap sama.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { analisisKontur } from "@/lib/audio/analisis";
import { deteksiPitch, NadaTidakTerdeteksiError, type ModelCrepe } from "@/lib/audio/crepe";
import type { NadaAcuan } from "@/lib/types";
import {
  durasiNada,
  muatCrepeNode,
  nadaAcak,
  nadaDariMidi,
  segmenDariNada,
  sinusDariNada,
  sinusDariSegmen,
} from "./bantuan";

const HOP_UJI = 800;

let model: ModelCrepe;
let acuan: NadaAcuan[];

async function analisis(audio: Float32Array) {
  const kontur = await deteksiPitch(audio, model, { hop: HOP_UJI, ukuranBatch: 64 });
  return analisisKontur(kontur, acuan);
}

describe("analisis nada dengan CREPE (do-mayor.mid)", () => {
  beforeAll(async () => {
    model = await muatCrepeNode();
    acuan = nadaDariMidi("do-mayor.mid");
  });

  it("nyanyian tepat mendapat skor ≥ 80", async () => {
    const hasil = await analisis(sinusDariNada(acuan));
    console.info("tepat:", hasil.skor, "meleset:", hasil.nadaMeleset.length);
    expect(hasil.skor).toBeGreaterThanOrEqual(80);
  });

  it("nyanyian bergeser 1 semiton mendapat skor ≤ 50", async () => {
    const hasil = await analisis(sinusDariNada(acuan, 1));
    console.info("+1 semiton:", hasil.skor, "meleset:", hasil.nadaMeleset.length);
    expect(hasil.skor).toBeLessThanOrEqual(50);
  });

  it("nyanyian satu oktaf lebih rendah tetap mendapat skor ≥ 80", async () => {
    const hasil = await analisis(sinusDariNada(acuan, -12));
    console.info("−1 oktaf:", hasil.skor, "meleset:", hasil.nadaMeleset.length);
    expect(hasil.skor).toBeGreaterThanOrEqual(80);
  });

  it("materi tepat diapit hening dan nada acak di awal/akhir tetap ≥ 80", async () => {
    // 1 dtk hening · 3,2 dtk nada acak · 1 dtk hening · materi · 1 dtk hening · 3,2 dtk nada acak · 1 dtk hening
    const awalMateri = 1 + 3.2 + 1;
    const akhirMateri = awalMateri + durasiNada(acuan);
    const audio = sinusDariSegmen(
      [
        ...nadaAcak(8, 1, 7),
        ...segmenDariNada(acuan, 0, awalMateri),
        ...nadaAcak(8, akhirMateri + 1, 11),
      ],
      akhirMateri + 1 + 3.2 + 1,
    );
    const hasil = await analisis(audio);
    console.info("diapit nada acak:", hasil.skor, "meleset:", hasil.nadaMeleset.length);
    expect(hasil.skor).toBeGreaterThanOrEqual(80);
  });

  it("materi tepat dengan satu lonjakan oktaf singkat tetap ≥ 80", async () => {
    // Nada ke-6 (A4) diganti A5 selama 0,1 detik di tengahnya.
    const segmen = segmenDariNada(acuan, 0, 0.5);
    const n = segmen[5];
    const tengah = n.mulai + n.durasi / 2;
    const lonjakan = [
      { ...n, durasi: tengah - 0.05 - n.mulai },
      { midi: n.midi + 12, mulai: tengah - 0.05, durasi: 0.1 },
      { ...n, mulai: tengah + 0.05, durasi: n.mulai + n.durasi - tengah - 0.05 },
    ];
    segmen.splice(5, 1, ...lonjakan);
    const hasil = await analisis(sinusDariSegmen(segmen, durasiNada(acuan) + 1));
    console.info("lonjakan oktaf:", hasil.skor, "meleset:", hasil.nadaMeleset.length);
    expect(hasil.skor).toBeGreaterThanOrEqual(80);
  });

  it("rekaman hening gagal dengan 'nada tidak terdeteksi'", async () => {
    const hening = new Float32Array(16000 * 5);
    await expect(analisis(hening)).rejects.toBeInstanceOf(NadaTidakTerdeteksiError);
  });
});
