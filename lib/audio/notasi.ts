import type { NadaAcuan } from "@/lib/types";

export type TokenNotasi = {
  midi: number | null;
  ketukan: 4 | 2 | 1 | 0.5;
  indeksNada: number | null;
  sambung: boolean;
};

export type Birama = TokenNotasi[];

const GRID = 0.5;
const NILAI: TokenNotasi["ketukan"][] = [4, 2, 1, 0.5];
const EPS = 1e-6;

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

export function tempoEfektif(tempoMidi: number | null | undefined, tempoMateri: number) {
  return tempoMidi && tempoMidi >= 20 && tempoMidi <= 300 ? tempoMidi : tempoMateri;
}
