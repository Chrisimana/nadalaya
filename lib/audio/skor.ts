import type { NadaAcuan, NadaMeleset, TitikPitch } from "@/lib/types";
import { median, type HasilPenyelarasan } from "./dtw";

export const BATAS_MELESET_CENT = 50;

export const BATAS_SKOR_PENUH_CENT = 20;
export const BATAS_SKOR_NOL_CENT = 100;

export function skorNada(deviasiCent: number | null) {
  if (deviasiCent === null) return 0;
  const d = Math.abs(deviasiCent);
  if (d <= BATAS_SKOR_PENUH_CENT) return 100;
  return (Math.max(0, BATAS_SKOR_NOL_CENT - d) / (BATAS_SKOR_NOL_CENT - BATAS_SKOR_PENUH_CENT)) * 100;
}

export function skorAkhir(deviasi: Array<number | null>) {
  if (deviasi.length === 0) return 0;
  return Math.round(deviasi.reduce<number>((s, d) => s + skorNada(d), 0) / deviasi.length);
}

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

export function konturSelaras(selaras: HasilPenyelarasan): TitikPitch[] {
  return selaras.acuan.map((b, i) => ({
    waktu: b.waktu,
    midi: selaras.terpetakan[i].length > 0 ? median(selaras.terpetakan[i]) : null,
  }));
}
