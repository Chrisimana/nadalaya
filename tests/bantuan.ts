/*
 * Bantuan uji: memuat CREPE dari public/models/crepe/ di Node dan
 * membangkitkan audio sinus sintetis dari deret nada MIDI.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as tf from "@tensorflow/tfjs";
import { bacaMidi } from "@/lib/audio/midi";
import { bungkusModel, LAJU_SAMPEL, type ModelCrepe } from "@/lib/audio/crepe";
import { midiKeHz } from "@/lib/audio/nada";
import type { NadaAcuan } from "@/lib/types";

const FOLDER_MODEL = join(process.cwd(), "public", "models", "crepe");

/** Memuat model CREPE dari berkas lokal (backend cpu, tanpa biner native). */
export async function muatCrepeNode(): Promise<ModelCrepe> {
  await tf.setBackend("cpu");
  const json = JSON.parse(readFileSync(join(FOLDER_MODEL, "model.json"), "utf8"));
  const spesifikasi = json.weightsManifest.flatMap((m: { weights: unknown[] }) => m.weights);
  const potongan = json.weightsManifest.flatMap((m: { paths: string[] }) =>
    m.paths.map((p) => readFileSync(join(FOLDER_MODEL, p))),
  );
  const gabung = Buffer.concat(potongan);
  const bobot = gabung.buffer.slice(gabung.byteOffset, gabung.byteOffset + gabung.byteLength);
  const model = await tf.loadLayersModel(
    tf.io.fromMemory({ modelTopology: json.modelTopology, weightSpecs: spesifikasi, weightData: bobot }),
  );
  return bungkusModel(tf, model);
}

export function nadaDariMidi(berkas: string): NadaAcuan[] {
  return bacaMidi(readFileSync(join(process.cwd(), "scripts", "midi", berkas))).nada;
}

/** Satu potongan nada sinus: nomor MIDI (pecahan boleh), mulai, durasi (detik). */
export type Segmen = { midi: number; mulai: number; durasi: number };

/** Audio sinus mono 16 kHz dari daftar segmen; di luar segmen hening. */
export function sinusDariSegmen(segmen: Segmen[], totalDetik: number, amplitudo = 0.5): Float32Array {
  const audio = new Float32Array(Math.ceil(totalDetik * LAJU_SAMPEL));
  const fade = Math.round(0.01 * LAJU_SAMPEL);
  for (const s of segmen) {
    const f = midiKeHz(s.midi);
    const awal = Math.round(s.mulai * LAJU_SAMPEL);
    const panjang = Math.round(s.durasi * LAJU_SAMPEL);
    for (let k = 0; k < panjang && awal + k < audio.length; k++) {
      const selubung = Math.min(1, k / fade, (panjang - k) / fade);
      audio[awal + k] += amplitudo * selubung * Math.sin((2 * Math.PI * f * k) / LAJU_SAMPEL);
    }
  }
  return audio;
}

/** Segmen dari deret nada acuan, digeser `geser` semiton dan dimulai pada `mulai` detik. */
export function segmenDariNada(nada: NadaAcuan[], geser = 0, mulai = 0): Segmen[] {
  return nada.map((n) => ({ midi: n.midi + geser, mulai: mulai + n.waktu, durasi: n.durasi }));
}

export function durasiNada(nada: NadaAcuan[]) {
  return Math.max(...nada.map((n) => n.waktu + n.durasi));
}

/**
 * Audio sinus mono 16 kHz dari deret nada, digeser `geser` semiton.
 * Diberi hening 0,5 detik di awal dan akhir seperti rekaman sungguhan.
 */
export function sinusDariNada(nada: NadaAcuan[], geser = 0, amplitudo = 0.5): Float32Array {
  const hening = 0.5;
  return sinusDariSegmen(segmenDariNada(nada, geser, hening), durasiNada(nada) + 2 * hening, amplitudo);
}

/** Deret nada acak yang dapat diulang (LCG), nada MIDI 55–79, tiap nada 0,4 detik. */
export function nadaAcak(jumlah: number, mulai: number, benih = 7): Segmen[] {
  let x = benih;
  return Array.from({ length: jumlah }, (_, i) => {
    x = (x * 1103515245 + 12345) % 2147483648;
    return { midi: 55 + (x % 25), mulai: mulai + i * 0.4, durasi: 0.38 };
  });
}
