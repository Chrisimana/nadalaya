/*
 * Penilaian akurasi nada (FR-14): deviasi per nada acuan, nada meleset,
 * dan skor 0–100. Fungsi murni.
 */
import type { NadaAcuan, NadaMeleset, TitikPitch } from "@/lib/types";
import { median, type HasilPenyelarasan } from "./dtw";

/** Nada dianggap meleset bila |deviasi| melebihi 50 cent. */
export const BATAS_MELESET_CENT = 50;

/** Deviasi hingga batas ini masih mendapat skor penuh. */
export const BATAS_SKOR_PENUH_CENT = 20;
/** Deviasi pada atau di atas batas ini mendapat skor 0. */
export const BATAS_SKOR_NOL_CENT = 100;

/**
 * Skor satu nada: 100 bila |deviasi| ≤ 20 cent, lalu turun linear hingga
 * 0 pada |deviasi| = 100 cent. Nada tanpa data = 0.
 */
export function skorNada(deviasiCent: number | null) {
  if (deviasiCent === null) return 0;
  const d = Math.abs(deviasiCent);
  if (d <= BATAS_SKOR_PENUH_CENT) return 100;
  return (Math.max(0, BATAS_SKOR_NOL_CENT - d) / (BATAS_SKOR_NOL_CENT - BATAS_SKOR_PENUH_CENT)) * 100;
}

/** Skor akhir: rata-rata skor nada, dibulatkan (0–100). */
export function skorAkhir(deviasi: Array<number | null>) {
  if (deviasi.length === 0) return 0;
  return Math.round(deviasi.reduce<number>((s, d) => s + skorNada(d), 0) / deviasi.length);
}

/**
 * Median deviasi (cent) tiap nada acuan dari bingkai nyanyian yang
 * terpetakan DTW. null bila nada tidak mendapat bingkai bersuara.
 */
export function deviasiPerNada(nada: NadaAcuan[], selaras: HasilPenyelarasan): Array<number | null> {
  const kumpulan: number[][] = nada.map(() => []);
  selaras.acuan.forEach((b, i) => {
    for (const m of selaras.terpetakan[i]) kumpulan[b.indeksNada].push((m - b.midi) * 100);
  });
  return kumpulan.map((d) => (d.length > 0 ? median(d) : null));
}

export function daftarMeleset(nada: NadaAcuan[], deviasi: Array<number | null>): NadaMeleset[] {
  return nada.flatMap((n, i) => {
    const d = deviasi[i];
    if (d !== null && Math.abs(d) <= BATAS_MELESET_CENT) return [];
    return [{ urutan: i + 1, midiAcuan: n.midi, selisihCent: d === null ? null : Math.round(d), waktu: n.waktu }];
  });
}

/**
 * Kontur nyanyian pada sumbu waktu acuan (hasil DTW) untuk grafik:
 * median nada yang terpetakan ke tiap bingkai acuan.
 */
export function konturSelaras(selaras: HasilPenyelarasan): TitikPitch[] {
  return selaras.acuan.map((b, i) => ({
    waktu: b.waktu,
    midi: selaras.terpetakan[i].length > 0 ? median(selaras.terpetakan[i]) : null,
  }));
}
