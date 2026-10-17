/*
 * Pembersihan kontur CREPE sebelum penyelarasan: potong hening di awal
 * dan akhir, koreksi lonjakan oktaf sesaat, dan median filter.
 * Fungsi murni.
 */
import type { TitikPitch } from "@/lib/types";

/** Jendela koreksi lonjakan oktaf (setengah lebar), dalam detik. */
const RADIUS_OKTAF_DETIK = 0.15;
/** Jendela median filter (setengah lebar), dalam detik. */
const RADIUS_MEDIAN_DETIK = 0.03;
/** Selisih (semiton) dari kelipatan 12 yang masih dianggap lonjakan oktaf. */
const TOLERANSI_OKTAF = 1.5;

function median(nilai: number[]) {
  const urut = [...nilai].sort((a, b) => a - b);
  const t = Math.floor(urut.length / 2);
  return urut.length % 2 ? urut[t] : (urut[t - 1] + urut[t]) / 2;
}

/** Jarak antarbingkai kontur (detik); bawaan 10 ms. */
function jarakBingkai(kontur: TitikPitch[]) {
  return kontur.length > 1 ? kontur[1].waktu - kontur[0].waktu : 0.01;
}

/** Membuang bingkai tanpa suara di awal dan akhir rekaman. */
export function potongHening(kontur: TitikPitch[]): TitikPitch[] {
  const awal = kontur.findIndex((t) => t.midi !== null);
  if (awal === -1) return [];
  let akhir = kontur.length - 1;
  while (kontur[akhir].midi === null) akhir--;
  return kontur.slice(awal, akhir + 1);
}

/**
 * Lonjakan oktaf sesaat: bingkai yang berjarak ~12 (atau 24) semiton dari
 * median tetangganya dianggap salah deteksi CREPE dan dikembalikan ke
 * oktaf tetangganya. Lonjakan yang menetap tidak terpengaruh karena median
 * tetangga ikut berpindah.
 */
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

/** Median filter pada bingkai bersuara; bingkai tanpa suara tetap null. */
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

/** Urutan lengkap: potong hening → koreksi oktaf → median filter. */
export function bersihkanKontur(kontur: TitikPitch[]): TitikPitch[] {
  return medianFilter(koreksiLonjakanOktaf(potongHening(kontur)));
}
