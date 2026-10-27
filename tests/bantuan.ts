import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as tf from "@tensorflow/tfjs";
import { bacaMidi } from "@/lib/audio/midi";
import { bungkusModel, LAJU_SAMPEL, type ModelCrepe } from "@/lib/audio/crepe";
import { midiKeHz } from "@/lib/audio/nada";
import type { NadaAcuan } from "@/lib/types";

const FOLDER_MODEL = join(process.cwd(), "public", "models", "crepe");

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

export type Segmen = { midi: number; mulai: number; durasi: number };

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

export function segmenDariNada(nada: NadaAcuan[], geser = 0, mulai = 0): Segmen[] {
  return nada.map((n) => ({ midi: n.midi + geser, mulai: mulai + n.waktu, durasi: n.durasi }));
}

/** Materi dimainkan `kecepatan` kali lebih cepat (1,3 = lebih cepat, 0,8 = lebih lambat). */
export function segmenBertempo(nada: NadaAcuan[], kecepatan: number, mulai = 0.5): Segmen[] {
  return nada.map((n) => ({ midi: n.midi, mulai: mulai + n.waktu / kecepatan, durasi: n.durasi / kecepatan }));
}

export function durasiNada(nada: NadaAcuan[]) {
  return Math.max(...nada.map((n) => n.waktu + n.durasi));
}

export function sinusDariNada(nada: NadaAcuan[], geser = 0, amplitudo = 0.5): Float32Array {
  const hening = 0.5;
  return sinusDariSegmen(segmenDariNada(nada, geser, hening), durasiNada(nada) + 2 * hening, amplitudo);
}

export function nadaAcak(jumlah: number, mulai: number, benih = 7): Segmen[] {
  let x = benih;
  return Array.from({ length: jumlah }, (_, i) => {
    x = (x * 1103515245 + 12345) % 2147483648;
    return { midi: 55 + (x % 25), mulai: mulai + i * 0.4, durasi: 0.38 };
  });
}
