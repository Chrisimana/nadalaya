/*
 * Penyelarasan nyanyian dengan acuan (FR-13): deret per bingkai,
 * toleransi oktaf, dan Dynamic Time Warping dengan pita Sakoe-Chiba.
 * Seluruhnya fungsi murni agar mudah diuji.
 */
import type { NadaAcuan, TitikPitch } from "@/lib/types";
import { bersihkanKontur } from "./kontur";

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
 * Subsequence DTW (open-begin dan open-end pada sisi nyanyian) dengan biaya
 * |selisih semiton|. Seluruh deret acuan (N) harus terpasang, tetapi boleh
 * cocok dengan sebagian nyanyian (M) saja, sehingga bagian rekaman di luar
 * materi diabaikan.
 *
 * Pita Sakoe-Chiba diukur relatif terhadap titik awal jalur (bukan diagonal
 * seluruh matriks): pada baris i, posisi j harus memenuhi
 * |(j − awal) − i| ≤ lebarPita. Dengan begitu rekaman yang jauh lebih panjang
 * dari acuan tetap tertangani, sementara perbedaan tempo tetap dibatasi.
 * Mengembalikan pasangan [i, j].
 */
export function dtw(acuan: number[], nyanyian: number[], lebarPita?: number): Array<[number, number]> {
  const N = acuan.length;
  const M = nyanyian.length;
  if (N === 0 || M === 0) return [];
  const w = lebarPita ?? Math.max(FPS_ANALISIS, Math.ceil(0.35 * N));

  const biaya = new Float64Array(N * M).fill(Infinity);
  const awal = new Int32Array(N * M).fill(-1);
  // 0 = awal jalur, 1 = diagonal, 2 = atas (i−1), 3 = kiri (j−1).
  const asal = new Uint8Array(N * M);
  const idx = (i: number, j: number) => i * M + j;

  for (let j = 0; j < M; j++) {
    biaya[idx(0, j)] = Math.abs(acuan[0] - nyanyian[j]);
    awal[idx(0, j)] = j;
  }

  for (let i = 1; i < N; i++) {
    for (let j = 0; j < M; j++) {
      let terbaik = Infinity;
      let arah = 0;
      let mulaiJalur = -1;
      const calon: Array<[number, number, number]> = [];
      if (j > 0) calon.push([idx(i - 1, j - 1), 1, 0]);
      calon.push([idx(i - 1, j), 2, 0]);
      if (j > 0) calon.push([idx(i, j - 1), 3, 0]);
      for (const [k, a] of calon) {
        const b = biaya[k];
        if (b < terbaik) {
          terbaik = b;
          arah = a;
          mulaiJalur = awal[k];
        }
      }
      if (!Number.isFinite(terbaik) || Math.abs(j - mulaiJalur - i) > w) continue;
      biaya[idx(i, j)] = terbaik + Math.abs(acuan[i] - nyanyian[j]);
      awal[idx(i, j)] = mulaiJalur;
      asal[idx(i, j)] = arah;
    }
  }

  // Open-end: akhir jalur di kolom mana pun pada baris terakhir acuan.
  let jAkhir = -1;
  let minimum = Infinity;
  for (let j = 0; j < M; j++) {
    if (biaya[idx(N - 1, j)] < minimum) {
      minimum = biaya[idx(N - 1, j)];
      jAkhir = j;
    }
  }
  if (jAkhir === -1) return [];

  const jalur: Array<[number, number]> = [];
  let i = N - 1;
  let j = jAkhir;
  jalur.push([i, j]);
  while (i > 0) {
    const a = asal[idx(i, j)];
    if (a === 1) {
      i--;
      j--;
    } else if (a === 2) {
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

/**
 * Menyelaraskan kontur nyanyian dengan nada acuan: kontur dibersihkan
 * (hening dipotong, lonjakan oktaf dikoreksi, median filter), diturunkan
 * resolusinya, digeser oktaf, lalu dipasangkan dengan subsequence DTW.
 */
export function selaraskan(kontur: TitikPitch[], nada: NadaAcuan[], fps = FPS_ANALISIS): HasilPenyelarasan {
  const acuan = deretAcuan(nada, fps);
  const nyanyian = turunkanResolusi(bersihkanKontur(kontur), fps);
  const midiAcuan = acuan.map((b) => b.midi);

  function pasangkan(geseran: number) {
    const tergeser = nyanyian.map((b) => b.midi - geseran);
    return { tergeser, jalur: dtw(midiAcuan, tergeser) };
  }

  // Perkiraan awal dari median seluruh nyanyian, lalu diperbaiki memakai
  // bagian yang benar-benar terpasang (rekaman bisa memuat nada di luar materi).
  let geseran = geserOktaf(
    nyanyian.map((b) => b.midi),
    midiAcuan,
  );
  let { tergeser, jalur } = pasangkan(geseran);
  const terpasang = jalur.map(([, j]) => nyanyian[j].midi);
  const perbaikan = geserOktaf(
    terpasang,
    jalur.map(([i]) => midiAcuan[i]),
  );
  if (jalur.length > 0 && perbaikan !== geseran) {
    geseran = perbaikan;
    ({ tergeser, jalur } = pasangkan(geseran));
  }

  const terpetakan: number[][] = acuan.map(() => []);
  for (const [i, j] of jalur) terpetakan[i].push(tergeser[j]);
  return { acuan, nyanyian, geseran, terpetakan };
}
