import type { NadaAcuan, TitikPitch } from "@/lib/types";
import { bersihkanKontur } from "./kontur";

export const FPS_ANALISIS = 20;

export type BingkaiAcuan = { waktu: number; midi: number; indeksNada: number };
/** midi null = bingkai tanpa suara; tetap disimpan agar skala waktu nyanyian utuh. */
export type BingkaiNyanyian = { waktu: number; midi: number | null };

/** Biaya (semiton) memasangkan acuan dengan bingkai tanpa suara. */
export const BIAYA_TANPA_SUARA = 2;

function median(nilai: number[]) {
  if (nilai.length === 0) return NaN;
  const urut = [...nilai].sort((a, b) => a - b);
  const t = Math.floor(urut.length / 2);
  return urut.length % 2 ? urut[t] : (urut[t - 1] + urut[t]) / 2;
}
export { median };

export function deretAcuan(nada: NadaAcuan[], fps = FPS_ANALISIS): BingkaiAcuan[] {
  const hasil: BingkaiAcuan[] = [];
  nada.forEach((n, indeksNada) => {
    const awal = Math.round(n.waktu * fps);
    const akhir = Math.max(awal + 1, Math.round((n.waktu + n.durasi) * fps));
    for (let f = awal; f < akhir; f++) hasil.push({ waktu: f / fps, midi: n.midi, indeksNada });
  });
  return hasil.sort((a, b) => a.waktu - b.waktu);
}

export function turunkanResolusi(kontur: TitikPitch[], fps = FPS_ANALISIS): BingkaiNyanyian[] {
  const kelompok = new Map<number, { bersuara: number[]; total: number }>();
  for (const t of kontur) {
    const k = Math.floor(t.waktu * fps + 1e-9);
    const isi = kelompok.get(k) ?? { bersuara: [], total: 0 };
    isi.total++;
    if (t.midi !== null) isi.bersuara.push(t.midi);
    kelompok.set(k, isi);
  }
  const urut = [...kelompok.keys()].sort((a, b) => a - b);
  if (urut.length === 0) return [];
  const hasil: BingkaiNyanyian[] = [];
  for (let k = urut[0]; k <= urut[urut.length - 1]; k++) {
    const isi = kelompok.get(k);
    const bersuara = isi && isi.bersuara.length > 0 && isi.bersuara.length * 2 >= isi.total;
    hasil.push({ waktu: k / fps, midi: bersuara ? median(isi.bersuara) : null });
  }
  return hasil;
}

function midiBersuara(bingkai: BingkaiNyanyian[]) {
  return bingkai.flatMap((b) => (b.midi === null ? [] : [b.midi]));
}

export function geserOktaf(nyanyian: number[], acuan: number[]) {
  const selisih = median(nyanyian) - median(acuan);
  if (!Number.isFinite(selisih)) return 0;
  return Math.round(selisih / 12) * 12;
}

/** Lebar pita Sakoe-Chiba; melebar bila nyanyian lebih pendek dari acuan (dinyanyikan lebih cepat). */
export function lebarPitaBawaan(N: number, M: number) {
  return Math.max(FPS_ANALISIS, Math.ceil(0.5 * N), N - M + FPS_ANALISIS);
}

/** nyanyian berisi NaN untuk bingkai tanpa suara. */
export function dtw(acuan: number[], nyanyian: number[], lebarPita?: number): Array<[number, number]> {
  const N = acuan.length;
  const M = nyanyian.length;
  if (N === 0 || M === 0) return [];
  const w = lebarPita ?? lebarPitaBawaan(N, M);
  const jarak = (a: number, n: number) => (Number.isNaN(n) ? BIAYA_TANPA_SUARA : Math.abs(a - n));

  const biaya = new Float64Array(N * M).fill(Infinity);
  const awal = new Int32Array(N * M).fill(-1);
  // 0 = awal jalur, 1 = diagonal, 2 = atas (i−1), 3 = kiri (j−1).
  const asal = new Uint8Array(N * M);
  const idx = (i: number, j: number) => i * M + j;

  for (let j = 0; j < M; j++) {
    biaya[idx(0, j)] = jarak(acuan[0], nyanyian[j]);
    awal[idx(0, j)] = j;
  }

  for (let i = 1; i < N; i++) {
    for (let j = 0; j < M; j++) {
      // Urutan pemeriksaan (diagonal, atas, kiri) menentukan pilihan saat biaya sama.
      let k = idx(i - 1, j);
      let arah = 2;
      if (j > 0 && biaya[idx(i - 1, j - 1)] <= biaya[k]) {
        k = idx(i - 1, j - 1);
        arah = 1;
      }
      if (j > 0 && biaya[idx(i, j - 1)] < biaya[k]) {
        k = idx(i, j - 1);
        arah = 3;
      }
      const terbaik = biaya[k];
      const mulaiJalur = awal[k];
      if (!Number.isFinite(terbaik) || Math.abs(j - mulaiJalur - i) > w) continue;
      biaya[idx(i, j)] = terbaik + jarak(acuan[i], nyanyian[j]);
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
  geseran: number;
  terpetakan: number[][];
};

export function selaraskan(kontur: TitikPitch[], nada: NadaAcuan[], fps = FPS_ANALISIS): HasilPenyelarasan {
  const acuan = deretAcuan(nada, fps);
  const nyanyian = turunkanResolusi(bersihkanKontur(kontur), fps);
  const midiAcuan = acuan.map((b) => b.midi);

  function pasangkan(geseran: number) {
    const tergeser = nyanyian.map((b) => (b.midi === null ? NaN : b.midi - geseran));
    return { tergeser, jalur: dtw(midiAcuan, tergeser) };
  }

  let geseran = geserOktaf(midiBersuara(nyanyian), midiAcuan);
  let { tergeser, jalur } = pasangkan(geseran);
  const pasanganBersuara = jalur.filter(([, j]) => nyanyian[j].midi !== null);
  const perbaikan = geserOktaf(
    pasanganBersuara.map(([, j]) => nyanyian[j].midi!),
    pasanganBersuara.map(([i]) => midiAcuan[i]),
  );
  if (pasanganBersuara.length > 0 && perbaikan !== geseran) {
    geseran = perbaikan;
    ({ tergeser, jalur } = pasangkan(geseran));
  }

  const terpetakan: number[][] = acuan.map(() => []);
  for (const [i, j] of jalur) if (!Number.isNaN(tergeser[j])) terpetakan[i].push(tergeser[j]);
  return { acuan, nyanyian, geseran, terpetakan };
}
