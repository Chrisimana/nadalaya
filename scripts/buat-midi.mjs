// Membuat 5 berkas MIDI contoh untuk materi seed (supabase/seed.sql).
// Jalankan: node scripts/buat-midi.mjs
// Hasil: scripts/midi/*.mid, lalu unggah ke bucket Storage "midi".
//
// Semua berkas monofonik: hanya satu nada pada satu waktu (SDD 3.2.8).

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import tonejsMidi from "@tonejs/midi";

const { Midi } = tonejsMidi;

const FOLDER = join(dirname(fileURLToPath(import.meta.url)), "midi");

// Nomor nada MIDI: 57 = A3, 60 = C4 (Do tengah), 72 = C5.
const C4 = 60, D4 = 62, E4 = 64, F4 = 65, Fis4 = 66, G4 = 67, A4 = 69, B4 = 71, C5 = 72;
const A3 = 57, B3 = 59;

/** null = jeda (tanpa nada) selama durasi ketukan. */
const JEDA = null;

const MATERI = [
  {
    berkas: "do-mayor.mid",
    judul: "Tangga Nada Do Mayor",
    tempo: 90,
    // Naik lalu turun, satu ketukan per nada.
    nada: [C4, D4, E4, F4, G4, A4, B4, C5, B4, A4, G4, F4, E4, D4, C4].map((n) => [n, 1]),
  },
  {
    berkas: "la-minor.mid",
    judul: "Tangga Nada La Minor",
    tempo: 90,
    // La minor asli, naik lalu turun.
    nada: [A3, B3, C4, D4, E4, F4, G4, A4, G4, F4, E4, D4, C4, B3, A3].map((n) => [n, 1]),
  },
  {
    berkas: "interval-terts-mayor.mid",
    judul: "Interval Terts Mayor",
    tempo: 80,
    // Pasangan nada berjarak 4 semiton, dipisah jeda satu ketukan.
    nada: [
      [C4, 1], [E4, 1], [JEDA, 1],
      [D4, 1], [Fis4, 1], [JEDA, 1],
      [F4, 1], [A4, 1], [JEDA, 1],
      [G4, 1], [B4, 1],
    ],
  },
  {
    berkas: "interval-kuint-murni.mid",
    judul: "Interval Kuint Murni",
    tempo: 80,
    // Pasangan nada berjarak 7 semiton, dipisah jeda satu ketukan.
    nada: [
      [C4, 1], [G4, 1], [JEDA, 1],
      [D4, 1], [A4, 1], [JEDA, 1],
      [E4, 1], [B4, 1], [JEDA, 1],
      [F4, 1], [C5, 1],
    ],
  },
  {
    berkas: "melodi-pagi-hari.mid",
    judul: "Melodi Pendek Pagi Hari",
    tempo: 96,
    // Melodi orisinal 4 birama (4/4).
    nada: [
      [C4, 1], [E4, 1], [G4, 1], [E4, 1],
      [F4, 1], [A4, 1], [G4, 2],
      [E4, 1], [G4, 1], [F4, 1], [D4, 1],
      [C4, 4],
    ],
  },
];

/** Bagian ketukan yang benar-benar berbunyi, agar ada jeda kecil antarnada. */
const LEGATO = 0.9;

function buatMidi({ judul, tempo, nada }) {
  const midi = new Midi();
  midi.header.setTempo(tempo);
  midi.header.timeSignatures.push({ ticks: 0, timeSignature: [4, 4] });
  midi.header.name = judul;

  const trek = midi.addTrack();
  trek.name = judul;
  trek.instrument.number = 0; // Acoustic Grand Piano

  const detikPerKetukan = 60 / tempo;
  let ketukan = 0;
  for (const [nomor, panjang] of nada) {
    if (nomor !== JEDA) {
      trek.addNote({
        midi: nomor,
        time: ketukan * detikPerKetukan,
        duration: panjang * detikPerKetukan * LEGATO,
        velocity: 0.8,
      });
    }
    ketukan += panjang;
  }
  return midi;
}

/** Pastikan tidak ada dua nada yang berbunyi bersamaan. */
function periksaMonofonik(midi, berkas) {
  const urut = [...midi.tracks[0].notes].sort((a, b) => a.time - b.time);
  for (let i = 1; i < urut.length; i++) {
    const sebelum = urut[i - 1];
    if (sebelum.time + sebelum.duration > urut[i].time + 1e-6) {
      throw new Error(`${berkas}: nada ke-${i} tumpang tindih dengan nada sebelumnya.`);
    }
  }
}

mkdirSync(FOLDER, { recursive: true });

for (const materi of MATERI) {
  const midi = buatMidi(materi);
  periksaMonofonik(midi, materi.berkas);
  writeFileSync(join(FOLDER, materi.berkas), Buffer.from(midi.toArray()));
  const jumlah = midi.tracks[0].notes.length;
  console.log(`✓ ${materi.berkas}  (${jumlah} nada, ${midi.duration.toFixed(1)} detik)`);
}

console.log(`\nSelesai. Berkas tersimpan di ${FOLDER}`);
