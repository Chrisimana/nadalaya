/*
 * Penyelarasan nyanyian dengan acuan (FR-13): deret per bingkai,
 * toleransi oktaf, dan Dynamic Time Warping dengan pita Sakoe-Chiba.
 * Seluruhnya fungsi murni agar mudah diuji.
 */
import type { NadaAcuan, TitikPitch } from "@/lib/types";

/** Resolusi deret setelah diturunkan: 20 bingkai per detik. */
export const FPS_ANALISIS = 20;

export type BingkaiAcuan = { waktu: number; midi: number; indeksNada: number };
export type BingkaiNyanyian = { waktu: number; midi: number };

function median(nilai: number[]) {
  if (nilai.length === 0) return NaN;
  const urut = [...nilai].sort((a, b) => a - b);
  const t = Math.floor(urut.length / 2);
  return urut.length % 2 ? urut[t] : (urut[t - 1] + urut[t]) / 2;
}
export { median };

/** Deret acuan per bingkai: nada yang berbunyi pada tiap waktu (jeda dilewati). */
export function deretAcuan(nada: NadaAcuan[], fps = FPS_ANALISIS): BingkaiAcuan[] {
  const hasil: BingkaiAcuan[] = [];
  nada.forEach((n, indeksNada) => {
    const awal = Math.round(n.waktu * fps);
    const akhir = Math.max(awal + 1, Math.round((n.waktu + n.durasi) * fps));
    for (let f = awal; f < akhir; f++) hasil.push({ waktu: f / fps, midi: n.midi, indeksNada });
  });
  return hasil.sort((a, b) => a.waktu - b.waktu);
}

/**
 * Menurunkan resolusi kontur CREPE (100 bingkai/detik) menjadi `fps`.
 * Tiap kelompok diwakili median nada bersuara; kelompok yang kurang dari
 * separuhnya bersuara dianggap tanpa suara dan dibuang. Waktu relatif
 * terhadap awal rekaman tetap dipertahankan.
 */
export function turunkanResolusi(kontur: TitikPitch[], fps = FPS_ANALISIS): BingkaiNyanyian[] {
  const kelompok = new Map<number, { bersuara: number[]; total: number }>();
  for (const t of kontur) {
    const k = Math.floor(t.waktu * fps + 1e-9);
    const isi = kelompok.get(k) ?? { bersuara: [], total: 0 };
    isi.total++;
    if (t.midi !== null) isi.bersuara.push(t.midi);
    kelompok.set(k, isi);
  }
  return [...kelompok.entries()]
    .sort((a, b) => a[0] - b[0])
    .filter(([, isi]) => isi.bersuara.length * 2 >= isi.total && isi.bersuara.length > 0)
    .map(([k, isi]) => ({ waktu: k / fps, midi: median(isi.bersuara) }));
}

/**
 * Toleransi oktaf: geseran kelipatan 12 semiton yang paling dekat dengan
 * selisih median nyanyian terhadap acuan. Nilai ini dikurangkan dari nyanyian.
 */
export function geserOktaf(nyanyian: number[], acuan: number[]) {
  const selisih = median(nyanyian) - median(acuan);
  if (!Number.isFinite(selisih)) return 0;
  return Math.round(selisih / 12) * 12;
}

/**
 * DTW antara deret acuan (panjang N) dan nyanyian (panjang M) dengan biaya
 * |selisih semiton|. Pita Sakoe-Chiba mengikuti diagonal yang diskalakan
 * agar waktu dan memori tetap terkendali. Mengembalikan pasangan [i, j].
 */
export function dtw(acuan: number[], nyanyian: number[], lebarPita?: number): Array<[number, number]> {
  const N = acuan.length;
  const M = nyanyian.length;
  if (N === 0 || M === 0) return [];
  const w = lebarPita ?? Math.max(10, Math.ceil(0.15 * Math.max(N, M)));
  const pusat = (i: number) => (N === 1 ? 0 : Math.round((i * (M - 1)) / (N - 1)));

  const biaya = new Float64Array(N * M).fill(Infinity);
  const idx = (i: number, j: number) => i * M + j;

  for (let i = 0; i < N; i++) {
    const c = pusat(i);
    const jAwal = Math.max(0, c - w);
    const jAkhir = Math.min(M - 1, c + w);
    for (let j = jAwal; j <= jAkhir; j++) {
      const d = Math.abs(acuan[i] - nyanyian[j]);
      if (i === 0 && j === 0) {
        biaya[0] = d;
        continue;
      }
      const atas = i > 0 ? biaya[idx(i - 1, j)] : Infinity;
      const kiri = j > 0 ? biaya[idx(i, j - 1)] : Infinity;
      const diag = i > 0 && j > 0 ? biaya[idx(i - 1, j - 1)] : Infinity;
      biaya[idx(i, j)] = d + Math.min(atas, kiri, diag);
    }
  }

  // Telusur balik dari ujung ke awal.
  const jalur: Array<[number, number]> = [];
  let i = N - 1;
  let j = M - 1;
  if (!Number.isFinite(biaya[idx(i, j)])) return [];
  jalur.push([i, j]);
  while (i > 0 || j > 0) {
    const diag = i > 0 && j > 0 ? biaya[idx(i - 1, j - 1)] : Infinity;
    const atas = i > 0 ? biaya[idx(i - 1, j)] : Infinity;
    const kiri = j > 0 ? biaya[idx(i, j - 1)] : Infinity;
    if (diag <= atas && diag <= kiri) {
      i--;
      j--;
    } else if (atas <= kiri) {
      i--;
    } else {
      j--;
    }
    jalur.push([i, j]);
  }
  return jalur.reverse();
}

export type HasilPenyelarasan = {
  acuan: BingkaiAcuan[];
  nyanyian: BingkaiNyanyian[];
  /** Geseran oktaf (semiton) yang sudah dikurangkan dari nyanyian. */
  geseran: number;
  /** Untuk tiap bingkai acuan: nada nyanyian yang terpetakan (setelah digeser). */
  terpetakan: number[][];
};

/** Menyelaraskan kontur nyanyian dengan nada acuan. */
export function selaraskan(kontur: TitikPitch[], nada: NadaAcuan[], fps = FPS_ANALISIS): HasilPenyelarasan {
  const acuan = deretAcuan(nada, fps);
  const nyanyian = turunkanResolusi(kontur, fps);
  const geseran = geserOktaf(
    nyanyian.map((b) => b.midi),
    acuan.map((b) => b.midi),
  );
  const tergeser = nyanyian.map((b) => b.midi - geseran);
  const jalur = dtw(
    acuan.map((b) => b.midi),
    tergeser,
  );

  const terpetakan: number[][] = acuan.map(() => []);
  for (const [i, j] of jalur) terpetakan[i].push(tergeser[j]);
  return { acuan, nyanyian, geseran, terpetakan };
}
