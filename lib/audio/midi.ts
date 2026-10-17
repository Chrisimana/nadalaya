import type { NadaAcuan } from "@/lib/types";

/**
 * Mengunduh berkas MIDI dari signed URL lalu membacanya dengan @tonejs/midi
 * menjadi deret nada acuan (monofonik, urut waktu).
 */
export async function muatNadaMidi(url: string): Promise<NadaAcuan[]> {
  const respons = await fetch(url, { cache: "no-store" });
  if (!respons.ok) throw new Error(`Berkas MIDI gagal diunduh (${respons.status}).`);
  const { Midi } = await import("@tonejs/midi");
  const midi = new Midi(await respons.arrayBuffer());

  const trek = midi.tracks.find((t) => t.notes.length > 0);
  if (!trek) throw new Error("Berkas MIDI tidak berisi nada.");

  return trek.notes
    .map((n) => ({ midi: n.midi, waktu: n.time, durasi: n.duration }))
    .sort((a, b) => a.waktu - b.waktu);
}
