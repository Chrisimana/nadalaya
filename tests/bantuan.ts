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

/**
 * Audio sinus mono 16 kHz dari deret nada, digeser `geser` semiton.
 * Diberi hening 0,5 detik di awal dan akhir seperti rekaman sungguhan.
 */
export function sinusDariNada(nada: NadaAcuan[], geser = 0, amplitudo = 0.5): Float32Array {
  const hening = 0.5;
  const akhir = Math.max(...nada.map((n) => n.waktu + n.durasi));
  const audio = new Float32Array(Math.ceil((akhir + 2 * hening) * LAJU_SAMPEL));
  const fade = Math.round(0.01 * LAJU_SAMPEL);
  for (const n of nada) {
    const f = midiKeHz(n.midi + geser);
    const awal = Math.round((n.waktu + hening) * LAJU_SAMPEL);
    const panjang = Math.round(n.durasi * LAJU_SAMPEL);
    for (let k = 0; k < panjang; k++) {
      const selubung = Math.min(1, k / fade, (panjang - k) / fade);
      audio[awal + k] += amplitudo * selubung * Math.sin((2 * Math.PI * f * k) / LAJU_SAMPEL);
    }
  }
  return audio;
}
