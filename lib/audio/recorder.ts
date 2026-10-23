export const DURASI_MAKS = 60;
export const DURASI_MIN = 2;
const AMBANG_SUARA = 0.01;
const INTERVAL_SAMPEL_MS = 50;

export type JenisGalatMikrofon =
  | "ditolak"
  | "tidak_ditemukan"
  | "sedang_dipakai"
  | "tidak_aman"
  | "tidak_didukung"
  | "lainnya";

export class GalatMikrofon extends Error {
  constructor(public jenis: JenisGalatMikrofon) {
    super(`Mikrofon tidak dapat digunakan (${jenis}).`);
    this.name = "GalatMikrofon";
  }
}

export type HasilRekaman = {
  blob: Blob;
  mimeType: string;
  durasi: number;
  puncakRms: number;
  terlaluPendek: boolean;
  tanpaSuara: boolean;
  berhentiOtomatis: boolean;
};

const KANDIDAT_FORMAT = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/mp4",
];

export function periksaDukungan(): JenisGalatMikrofon | null {
  if (typeof window === "undefined") return "tidak_didukung";
  if (!window.isSecureContext) return "tidak_aman";
  if (!navigator.mediaDevices?.getUserMedia || !("MediaRecorder" in window)) {
    return "tidak_didukung";
  }
  return null;
}

function pilihFormat() {
  return KANDIDAT_FORMAT.find((f) => MediaRecorder.isTypeSupported(f)) ?? "";
}

function terjemahkanGalat(err: unknown): GalatMikrofon {
  const nama = err instanceof DOMException ? err.name : "";
  switch (nama) {
    case "NotAllowedError":
    case "SecurityError":
      return new GalatMikrofon("ditolak");
    case "NotFoundError":
    case "OverconstrainedError":
      return new GalatMikrofon("tidak_ditemukan");
    case "NotReadableError":
    case "AbortError":
      return new GalatMikrofon("sedang_dipakai");
    default:
      return new GalatMikrofon("lainnya");
  }
}

export function rmsKeLevel(rms: number) {
  if (rms <= 0) return 0;
  const db = 20 * Math.log10(rms);
  return Math.min(1, Math.max(0, (db + 60) / 60));
}

export class PerekamSuara {
  private stream: MediaStream | null = null;
  private konteks: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private recorder: MediaRecorder | null = null;
  private potongan: Blob[] = [];
  private buffer: Float32Array<ArrayBuffer> | null = null;
  private pewaktuSampel: ReturnType<typeof setInterval> | null = null;
  private pewaktuMaks: ReturnType<typeof setTimeout> | null = null;
  private waktuMulai = 0;
  private rmsTerakhir = 0;
  private puncakRms = 0;
  private berhentiOtomatis = false;
  private durasiAkhir = 0;
  private janjiSelesai: Promise<HasilRekaman> | null = null;

  onBerhentiOtomatis?: (hasil: HasilRekaman) => void;

  async mulai() {
    const tidakDidukung = periksaDukungan();
    if (tidakDidukung) throw new GalatMikrofon(tidakDidukung);

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          // Pengolahan bawaan dimatikan agar tinggi nada tidak terdistorsi.
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
    } catch (err) {
      throw terjemahkanGalat(err);
    }

    try {
      this.konteks = new AudioContext();
      const sumber = this.konteks.createMediaStreamSource(this.stream);
      this.analyser = this.konteks.createAnalyser();
      this.analyser.fftSize = 2048;
      sumber.connect(this.analyser);
      this.buffer = new Float32Array(this.analyser.fftSize);

      const format = pilihFormat();
      this.recorder = new MediaRecorder(
        this.stream,
        format ? { mimeType: format } : undefined,
      );
    } catch {
      this.bersihkan();
      throw new GalatMikrofon("tidak_didukung");
    }

    this.potongan = [];
    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.potongan.push(e.data);
    };
    this.janjiSelesai = new Promise((selesai) => {
      this.recorder!.onstop = () => selesai(this.buatHasil());
    });

    this.recorder.start(250);
    this.waktuMulai = performance.now();
    this.pewaktuSampel = setInterval(() => this.sampel(), INTERVAL_SAMPEL_MS);
    this.pewaktuMaks = setTimeout(async () => {
      this.berhentiOtomatis = true;
      const hasil = await this.berhenti();
      this.onBerhentiOtomatis?.(hasil);
    }, DURASI_MAKS * 1000);
  }

  private sampel() {
    if (!this.analyser || !this.buffer) return;
    this.analyser.getFloatTimeDomainData(this.buffer);
    let jumlah = 0;
    for (let i = 0; i < this.buffer.length; i++) {
      jumlah += this.buffer[i] * this.buffer[i];
    }
    this.rmsTerakhir = Math.sqrt(jumlah / this.buffer.length);
    this.puncakRms = Math.max(this.puncakRms, this.rmsTerakhir);
  }

  get level() {
    return rmsKeLevel(this.rmsTerakhir);
  }

  get durasi() {
    if (!this.waktuMulai) return 0;
    return Math.min(DURASI_MAKS, (performance.now() - this.waktuMulai) / 1000);
  }

  async berhenti(): Promise<HasilRekaman> {
    if (!this.recorder || !this.janjiSelesai) {
      throw new Error("Perekaman belum dimulai.");
    }
    if (this.recorder.state !== "inactive") {
      this.durasiAkhir = this.durasi;
      this.hentikanPewaktu();
      this.recorder.stop();
    }
    return this.janjiSelesai;
  }

  private buatHasil(): HasilRekaman {
    const mimeType = this.recorder?.mimeType || pilihFormat() || "audio/webm";
    const durasi = this.durasiAkhir;
    const hasil: HasilRekaman = {
      blob: new Blob(this.potongan, { type: mimeType }),
      mimeType,
      durasi,
      puncakRms: this.puncakRms,
      terlaluPendek: durasi < DURASI_MIN,
      tanpaSuara: this.puncakRms < AMBANG_SUARA,
      berhentiOtomatis: this.berhentiOtomatis,
    };
    this.bersihkan();
    return hasil;
  }

  batalkan() {
    this.hentikanPewaktu();
    if (this.recorder && this.recorder.state !== "inactive") {
      this.recorder.onstop = null;
      this.recorder.stop();
    }
    this.bersihkan();
  }

  private hentikanPewaktu() {
    if (this.pewaktuSampel) clearInterval(this.pewaktuSampel);
    if (this.pewaktuMaks) clearTimeout(this.pewaktuMaks);
    this.pewaktuSampel = null;
    this.pewaktuMaks = null;
  }

  private bersihkan() {
    this.hentikanPewaktu();
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    if (this.konteks && this.konteks.state !== "closed") {
      void this.konteks.close();
    }
    this.konteks = null;
    this.analyser = null;
  }
}
