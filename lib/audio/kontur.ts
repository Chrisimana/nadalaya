import type { TitikPitch } from "@/lib/types";

const RADIUS_OKTAF_DETIK = 0.15;
const RADIUS_MEDIAN_DETIK = 0.05;
const TOLERANSI_OKTAF = 1.5;

const RADIUS_KONTEKS_DETIK = 0.15;
export const MAKS_LONJAKAN_DETIK = 0.12;
const MIN_SIMPANGAN_LONJAKAN = 3;
const MAKS_BEDA_KONTEKS = 2;

function median(nilai: number[]) {
  const urut = [...nilai].sort((a, b) => a - b);
  const t = Math.floor(urut.length / 2);
  return urut.length % 2 ? urut[t] : (urut[t - 1] + urut[t]) / 2;
}

function jarakBingkai(kontur: TitikPitch[]) {
  return kontur.length > 1 ? kontur[1].waktu - kontur[0].waktu : 0.01;
}

export function potongHening(kontur: TitikPitch[]): TitikPitch[] {
  const awal = kontur.findIndex((t) => t.midi !== null);
  if (awal === -1) return [];
  let akhir = kontur.length - 1;
  while (kontur[akhir].midi === null) akhir--;
  return kontur.slice(awal, akhir + 1);
}

export function koreksiLonjakanOktaf(kontur: TitikPitch[]): TitikPitch[] {
  const r = Math.max(2, Math.round(RADIUS_OKTAF_DETIK / jarakBingkai(kontur)));
  return kontur.map((t, i) => {
    if (t.midi === null) return t;
    const tetangga: number[] = [];
    for (let k = Math.max(0, i - r); k <= Math.min(kontur.length - 1, i + r); k++) {
      const m = kontur[k].midi;
      if (k !== i && m !== null) tetangga.push(m);
    }
    if (tetangga.length < 2) return t;
    const selisih = t.midi - median(tetangga);
    const oktaf = Math.round(selisih / 12);
    if (oktaf !== 0 && Math.abs(selisih - oktaf * 12) <= TOLERANSI_OKTAF) {
      return { ...t, midi: t.midi - oktaf * 12 };
    }
    return t;
  });
}

function medianBersuara(kontur: TitikPitch[], dari: number, sampai: number) {
  const nilai: number[] = [];
  for (let k = Math.max(0, dari); k <= Math.min(kontur.length - 1, sampai); k++) {
    const m = kontur[k].midi;
    if (m !== null) nilai.push(m);
  }
  return nilai.length > 0 ? median(nilai) : null;
}

/**
 * Lonjakan singkat (≤ 0,12 dtk, > 3 semiton) yang diapit nada yang sama dijadikan tanpa suara.
 * Perpindahan nada yang sah tidak terhapus karena nada sebelum dan sesudahnya berbeda.
 */
export function hapusLonjakanSingkat(kontur: TitikPitch[]): TitikPitch[] {
  const jarak = jarakBingkai(kontur);
  const r = Math.max(2, Math.round(RADIUS_KONTEKS_DETIK / jarak));
  const maks = Math.max(1, Math.round(MAKS_LONJAKAN_DETIK / jarak));

  const menyimpang = kontur.map((t, i) => {
    if (t.midi === null) return false;
    const acuan = medianBersuara(kontur, i - r, i + r);
    return acuan !== null && Math.abs(t.midi - acuan) > MIN_SIMPANGAN_LONJAKAN;
  });

  const hasil = [...kontur];
  for (let awal = 0; awal < kontur.length; awal++) {
    if (!menyimpang[awal]) continue;
    let akhir = awal;
    while (akhir + 1 < kontur.length && menyimpang[akhir + 1]) akhir++;

    if (akhir - awal + 1 <= maks) {
      const sebelum = medianBersuara(kontur, awal - r, awal - 1);
      const sesudah = medianBersuara(kontur, akhir + 1, akhir + r);
      const lonjakan = medianBersuara(kontur, awal, akhir);
      if (
        sebelum !== null &&
        sesudah !== null &&
        lonjakan !== null &&
        Math.abs(sebelum - sesudah) <= MAKS_BEDA_KONTEKS &&
        Math.abs(lonjakan - sebelum) > MIN_SIMPANGAN_LONJAKAN &&
        Math.abs(lonjakan - sesudah) > MIN_SIMPANGAN_LONJAKAN
      ) {
        for (let k = awal; k <= akhir; k++) hasil[k] = { ...kontur[k], midi: null };
      }
    }
    awal = akhir;
  }
  return hasil;
}

export function medianFilter(kontur: TitikPitch[]): TitikPitch[] {
  const r = Math.max(1, Math.round(RADIUS_MEDIAN_DETIK / jarakBingkai(kontur)));
  return kontur.map((t, i) => {
    if (t.midi === null) return t;
    const jendela: number[] = [];
    for (let k = Math.max(0, i - r); k <= Math.min(kontur.length - 1, i + r); k++) {
      const m = kontur[k].midi;
      if (m !== null) jendela.push(m);
    }
    return { ...t, midi: median(jendela) };
  });
}

export function bersihkanKontur(kontur: TitikPitch[]): TitikPitch[] {
  return medianFilter(hapusLonjakanSingkat(koreksiLonjakanOktaf(potongHening(kontur))));
}
