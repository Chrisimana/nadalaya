/** Utilitas konversi nada MIDI, Hertz, dan cent. */

const NAMA_KROMATIK = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

/** Contoh: 60 → "C4", 61 → "C#4". */
export function namaNada(midi: number) {
  const bulat = Math.round(midi);
  return `${NAMA_KROMATIK[((bulat % 12) + 12) % 12]}${Math.floor(bulat / 12) - 1}`;
}

/** Kunci VexFlow, contoh: 61 → "c#/4". */
export function kunciVexflow(midi: number) {
  const bulat = Math.round(midi);
  return `${NAMA_KROMATIK[((bulat % 12) + 12) % 12].toLowerCase()}/${Math.floor(bulat / 12) - 1}`;
}

export function midiKeHz(midi: number) {
  return 440 * 2 ** ((midi - 69) / 12);
}

export function hzKeMidi(hz: number) {
  return 69 + 12 * Math.log2(hz / 440);
}

/** Selisih dua nada dalam cent (100 cent = 1 semitone). */
export function selisihCent(midiNyanyian: number, midiAcuan: number) {
  return (midiNyanyian - midiAcuan) * 100;
}
