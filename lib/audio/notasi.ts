/*
 * Menyusun deret nada acuan menjadi birama notasi balok (UC-10).
 * Fungsi murni: tidak bergantung pada VexFlow agar mudah diuji.
 */
import type { NadaAcuan } from "@/lib/types";

/** Satu simbol pada notasi: not (midi terisi) atau tanda diam (midi null). */
export type TokenNotasi = {
  midi: number | null;
  /** Panjang dalam ketukan not seperempat: 4, 2, 1, atau 0,5. */
  ketukan: 4 | 2 | 1 | 0.5;
  /** Indeks nada acuan asal, untuk penanda saat diputar. */
  indeksNada: number | null;
  /** true bila disambung (tie) ke token berikutnya. */
  sambung: boolean;
};

export type Birama = TokenNotasi[];

/** Resolusi kuantisasi: not 1/8 = setengah ketukan. */
const GRID = 0.5;
const NILAI: TokenNotasi["ketukan"][] = [4, 2, 1, 0.5];
const EPS = 1e-6;

/**
 * Kuantisasi waktu dan durasi ke not 1/1, 1/2, 1/4, 1/8 berdasarkan tempo,
 * lalu pecah ke birama (bawaan 4/4). Not yang melewati garis birama atau
 * panjangnya bukan nilai dasar dipecah dan disambung dengan tie.
 */
export function susunBirama(nada: NadaAcuan[], tempo: number, ketukanPerBirama = 4): Birama[] {
  const detikPerKetukan = 60 / tempo;
  const kuantisasi = (detik: number) => Math.round(detik / detikPerKetukan / GRID) * GRID;

  const birama: Birama[] = [];
  let isi: TokenNotasi[] = [];
  let posisi = 0;

  function tambah(midi: number | null, panjang: number, indeksNada: number | null) {
    while (panjang > EPS) {
      const potong = Math.min(panjang, ketukanPerBirama - posisi);
      let sisa = potong;
      while (sisa > EPS) {
        const nilai = NILAI.find((v) => v <= sisa + EPS) ?? 0.5;
        sisa -= nilai;
        posisi += nilai;
        const masihBerlanjut = sisa > EPS || panjang - potong > EPS;
        isi.push({ midi, ketukan: nilai, indeksNada, sambung: midi !== null && masihBerlanjut });
      }
      panjang -= potong;
      if (posisi >= ketukanPerBirama - EPS) {
        birama.push(isi);
        isi = [];
        posisi = 0;
      }
    }
  }

  let kursor = 0;
  [...nada]
    .map((n, i) => ({ ...n, i }))
    .sort((a, b) => a.waktu - b.waktu)
    .forEach((n) => {
      const mulai = Math.max(kuantisasi(n.waktu), kursor);
      const akhir = Math.max(kuantisasi(n.waktu + n.durasi), mulai + GRID);
      if (mulai - kursor > EPS) tambah(null, mulai - kursor, null);
      tambah(n.midi, akhir - mulai, n.i);
      kursor = akhir;
    });

  // Lengkapi birama terakhir dengan tanda diam.
  if (posisi > EPS) tambah(null, ketukanPerBirama - posisi, null);
  return birama;
}

/** Tempo dari MIDI bila ada, selain itu tempo materi di basis data. */
export function tempoEfektif(tempoMidi: number | null | undefined, tempoMateri: number) {
  return tempoMidi && tempoMidi >= 20 && tempoMidi <= 300 ? tempoMidi : tempoMateri;
}
