import { Midi } from "@tonejs/midi";
import type { NadaAcuan } from "@/lib/types";

export type DataMidi = {
  nada: NadaAcuan[];
  /** Tempo pertama di header MIDI (BPM), null bila tidak ada. */
  tempo: number | null;
};

/** Membaca isi berkas MIDI menjadi deret nada acuan (monofonik, urut waktu). */
export function bacaMidi(isi: ArrayBuffer | Uint8Array): DataMidi {
  const midi = new Midi(isi);
  const trek = midi.tracks.find((t) => t.notes.length > 0);
  if (!trek) throw new Error("Berkas MIDI tidak berisi nada.");

  const nada = trek.notes
    .map((n) => ({ midi: n.midi, waktu: n.time, durasi: n.duration }))
    .sort((a, b) => a.waktu - b.waktu);
  const bpm = midi.header.tempos[0]?.bpm;
  return { nada, tempo: bpm ? Math.round(bpm) : null };
}

/** Mengunduh berkas MIDI dari signed URL lalu membacanya. */
export async function muatMidi(url: string): Promise<DataMidi> {
  const respons = await fetch(url, { cache: "no-store" });
  if (!respons.ok) throw new Error(`Berkas MIDI gagal diunduh (${respons.status}).`);
  return bacaMidi(await respons.arrayBuffer());
}
