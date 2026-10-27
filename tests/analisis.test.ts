import { beforeAll, describe, expect, it } from "vitest";
import { analisisKontur } from "@/lib/audio/analisis";
import { deteksiPitch, NadaTidakTerdeteksiError, type ModelCrepe } from "@/lib/audio/crepe";
import { deretAcuan } from "@/lib/audio/dtw";
import type { NadaAcuan } from "@/lib/types";
import {
  durasiNada,
  muatCrepeNode,
  nadaAcak,
  nadaDariMidi,
  segmenBertempo,
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

  it("materi dinyanyikan 1,3× lebih cepat tetap ≥ 80 dan nada turun di akhir terbaca", async () => {
    const audio = sinusDariSegmen(segmenBertempo(acuan, 1.3), durasiNada(acuan) / 1.3 + 1);
    const hasil = await analisis(audio);
    console.info("1,3× lebih cepat:", hasil.skor, "meleset:", hasil.nadaMeleset.length);
    expect(hasil.skor).toBeGreaterThanOrEqual(80);
    // Tiga nada terakhir (E4, D4, C4) tidak boleh hilang atau menjadi garis datar.
    expect(hasil.nadaMeleset.filter((m) => m.urutan >= acuan.length - 2)).toEqual([]);
  });

  it("materi dinyanyikan 0,8× (lebih lambat) tetap ≥ 80", async () => {
    const audio = sinusDariSegmen(segmenBertempo(acuan, 0.8), durasiNada(acuan) / 0.8 + 1);
    const hasil = await analisis(audio);
    console.info("0,8× lebih lambat:", hasil.skor, "meleset:", hasil.nadaMeleset.length);
    expect(hasil.skor).toBeGreaterThanOrEqual(80);
  });

  it("lonjakan singkat 1 oktaf ke bawah tetap ≥ 80 dan tidak tampil di kontur", async () => {
    // Nada ke-6 (A4) diganti A3 selama 0,1 detik di tengahnya.
    const segmen = segmenDariNada(acuan, 0, 0.5);
    const n = segmen[5];
    const tengah = n.mulai + n.durasi / 2;
    segmen.splice(
      5,
      1,
      { ...n, durasi: tengah - 0.05 - n.mulai },
      { midi: n.midi - 12, mulai: tengah - 0.05, durasi: 0.1 },
      { ...n, mulai: tengah + 0.05, durasi: n.mulai + n.durasi - tengah - 0.05 },
    );
    const hasil = await analisis(sinusDariSegmen(segmen, durasiNada(acuan) + 1));
    console.info("lonjakan −1 oktaf:", hasil.skor, "meleset:", hasil.nadaMeleset.length);
    expect(hasil.skor).toBeGreaterThanOrEqual(80);

    const bingkai = deretAcuan(acuan);
    hasil.kontur.forEach((t, i) => {
      if (t.midi !== null) expect(Math.abs(t.midi - bingkai[i].midi)).toBeLessThan(3);
    });
  });

  it("rekaman hening gagal dengan 'nada tidak terdeteksi'", async () => {
    const hening = new Float32Array(16000 * 5);
    await expect(analisis(hening)).rejects.toBeInstanceOf(NadaTidakTerdeteksiError);
  });
});
