import type { getDraw, Synth } from "tone";
import type { NadaAcuan } from "@/lib/types";
import { midiKeHz } from "./nada";

export class AudioDiblokirError extends Error {
  constructor() {
    super(
      "Browser memblokir pemutaran audio. Klik tombol Putar Acuan sekali lagi, atau izinkan suara untuk situs ini di pengaturan browser.",
    );
    this.name = "AudioDiblokirError";
  }
}

export class AcuanGagalDimuatError extends Error {
  constructor() {
    super("Acuan gagal dimuat.");
    this.name = "AcuanGagalDimuatError";
  }
}

export type KeadaanAcuan = {
  status: "diam" | "menyiapkan" | "memutar";
  indeksAktif: number | null;
};

const DIAM: KeadaanAcuan = { status: "diam", indeksAktif: null };

let keadaan: KeadaanAcuan = DIAM;
const pendengar = new Set<() => void>();
let synth: Synth | null = null;
let draw: ReturnType<typeof getDraw> | null = null;
let pewaktu: ReturnType<typeof setTimeout>[] = [];
let nomorSesi = 0;

/**
 * Saat AudioContext baru dinyalakan, jamnya bisa diam beberapa ratus milidetik sampai perangkat
 * audio siap. Penjadwalan ditunda sampai jam benar-benar bergerak agar nada tidak tertinggal.
 */
async function tungguJamAudio(waktuSekarang: () => number, batasMs = 1500) {
  const awal = waktuSekarang();
  const mulai = performance.now();
  while (waktuSekarang() <= awal && performance.now() - mulai < batasMs) {
    await new Promise((r) => setTimeout(r, 10));
  }
}

function setKeadaan(baru: KeadaanAcuan) {
  keadaan = baru;
  pendengar.forEach((p) => p());
}

export function langgananAcuan(p: () => void) {
  pendengar.add(p);
  return () => {
    pendengar.delete(p);
  };
}

export function ambilKeadaanAcuan() {
  return keadaan;
}

export function ambilKeadaanAcuanServer() {
  return DIAM;
}

export function hentikanAcuan() {
  nomorSesi++;
  pewaktu.forEach(clearTimeout);
  pewaktu = [];
  draw?.cancel(0);
  if (synth) {
    // Membuang synth sekaligus membatalkan nada yang sudah dijadwalkan.
    synth.dispose();
    synth = null;
  }
  if (keadaan !== DIAM) setKeadaan(DIAM);
}

export async function putarAcuan(nada: NadaAcuan[]) {
  hentikanAcuan();
  if (nada.length === 0) return;
  const sesi = nomorSesi;
  setKeadaan({ status: "menyiapkan", indeksAktif: null });

  try {
    let Tone: typeof import("tone");
    try {
      Tone = await import("tone");
    } catch {
      throw new AcuanGagalDimuatError();
    }
    try {
      await Tone.start();
    } catch {
      throw new AudioDiblokirError();
    }
    if (Tone.getContext().state !== "running") throw new AudioDiblokirError();
    await tungguJamAudio(() => Tone.getContext().rawContext.currentTime);
    if (sesi !== nomorSesi) return;

    synth = new Tone.Synth({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.02, decay: 0.15, sustain: 0.6, release: 0.25 },
    }).toDestination();
    draw = Tone.getDraw();

    const jeda = 0.15;
    const mulai = Tone.now() + jeda;
    // Suara baru terdengar setelah latensi keluaran perangkat; sorotan digeser sebesar itu.
    const konteks = Tone.getContext().rawContext as AudioContext;
    const latensi = konteks.outputLatency || konteks.baseLatency || 0;
    setKeadaan({ status: "memutar", indeksAktif: null });

    // Sorotan not dijadwalkan pada jam audio yang sama dengan nadanya, bukan setTimeout.
    nada.forEach((n, i) => {
      synth!.triggerAttackRelease(midiKeHz(n.midi), Math.max(0.05, n.durasi * 0.95), mulai + n.waktu);
      draw!.schedule(() => {
        if (sesi === nomorSesi) setKeadaan({ status: "memutar", indeksAktif: i });
      }, mulai + n.waktu + latensi);
    });

    // Akhir putaran memakai setTimeout karena Draw berhenti saat tab tidak terlihat.
    const akhir = Math.max(...nada.map((n) => n.waktu + n.durasi));
    pewaktu.push(
      setTimeout(() => {
        if (sesi === nomorSesi) hentikanAcuan();
      }, (mulai + akhir + 0.3 - Tone.now()) * 1000),
    );
  } catch (err) {
    if (sesi === nomorSesi) hentikanAcuan();
    if (err instanceof AudioDiblokirError) throw err;
    throw err instanceof AcuanGagalDimuatError
      ? err
      : new AcuanGagalDimuatError();
  }
}
