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

export function namaNada(midi: number) {
  const bulat = Math.round(midi);
  return `${NAMA_KROMATIK[((bulat % 12) + 12) % 12]}${Math.floor(bulat / 12) - 1}`;
}

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

export function selisihCent(midiNyanyian: number, midiAcuan: number) {
  return (midiNyanyian - midiAcuan) * 100;
}
