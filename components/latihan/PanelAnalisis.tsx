"use client";

import { Check, RotateCcw, RotateCw, Sparkles } from "lucide-react";
import { KuotaHabis } from "@/components/akses/KuotaHabis";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import type { HasilRekaman } from "@/lib/audio/recorder";
import {
  TAHAP_PROSES,
  type AlasanGagal,
  type KeadaanAnalisis,
} from "@/lib/audio/useAnalisis";
import { cn } from "@/lib/utils";

const LABEL_TAHAP: Record<(typeof TAHAP_PROSES)[number], string> = {
  memeriksa_kuota: "Memeriksa kuota",
  memuat_model: "Memuat model analisis",
  menganalisis: "Menganalisis nada",
};

const KETERANGAN_TAHAP: Record<string, string> = {
  memeriksa_kuota: "Memeriksa sisa kuota analisis Anda…",
  memuat_model:
    "Memuat model CREPE (±2 MB). Analisis pertama butuh waktu lebih lama karena model diunduh lalu disimpan di browser.",
  menganalisis: "Mendeteksi nada nyanyian dan mencocokkannya dengan acuan…",
  menyimpan: "Menyimpan hasil ke riwayat latihan…",
};

const PESAN_GAGAL: Record<
  Exclude<AlasanGagal, "kuota_habis">,
  { judul: string; isi: string; aksi: "coba_lagi" | "rekam_ulang" | null }
> = {
  belum_tersambung: {
    judul: "Analisis belum dapat dimulai",
    isi: "Belum tersambung ke server, sehingga kuota tidak dapat diperiksa dan sesi analisis tidak dapat dicatat.",
    aksi: "coba_lagi",
  },
  materi_premium: {
    judul: "Materi ini khusus Premium",
    isi: "Beralih ke Premium untuk menganalisis materi ini.",
    aksi: null,
  },
  acuan_tidak_tersedia: {
    judul: "Acuan nada belum tersedia",
    isi: "Data nada acuan materi ini belum tersedia, sehingga nyanyian belum dapat dibandingkan. Kuota Anda tidak berkurang.",
    aksi: null,
  },
  model_gagal: {
    judul: "Model analisis gagal dimuat",
    isi: "Periksa koneksi internet Anda, lalu coba lagi. Kuota Anda tidak berkurang.",
    aksi: "coba_lagi",
  },
  nada_tidak_terdeteksi: {
    judul: "Suara tidak terdeteksi, silakan rekam ulang",
    isi: "Sistem tidak menemukan nada yang jelas pada rekaman. Bernyanyilah lebih dekat ke mikrofon. Kuota Anda tidak berkurang.",
    aksi: "rekam_ulang",
  },
  lainnya: {
    judul: "Analisis gagal",
    isi: "Terjadi kesalahan saat menganalisis rekaman. Kuota Anda tidak berkurang. Silakan coba lagi.",
    aksi: "coba_lagi",
  },
};

function LangkahProses({
  tahap,
  progres,
}: {
  tahap: KeadaanAnalisis["tahap"];
  progres?: number;
}) {
  const indeksAktif =
    tahap === "menyimpan"
      ? TAHAP_PROSES.length
      : TAHAP_PROSES.indexOf(tahap as (typeof TAHAP_PROSES)[number]);

  return (
    <div className="flex flex-col gap-4" aria-live="polite">
      <ol className="grid gap-3 sm:grid-cols-3">
        {TAHAP_PROSES.map((t, i) => {
          const selesai = i < indeksAktif;
          const aktif = i === indeksAktif;
          return (
            <li
              key={t}
              className={cn(
                "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm",
                aktif
                  ? "border-nada-300 bg-nada-50 font-semibold text-nada-800"
                  : selesai
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-garis text-redup",
              )}
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  aktif
                    ? "text-nada-700"
                    : selesai
                      ? "bg-emerald-600 text-white"
                      : "bg-nada-50 text-redup",
                )}
              >
                {aktif ? (
                  <Spinner className="size-4" />
                ) : selesai ? (
                  <Check className="size-3.5" aria-hidden="true" />
                ) : (
                  i + 1
                )}
              </span>
              {LABEL_TAHAP[t]}
            </li>
          );
        })}
      </ol>
      {progres !== undefined && (
        <div
          role="progressbar"
          aria-label="Progres analisis nada"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progres * 100)}
          className="h-2 overflow-hidden rounded-full bg-nada-100"
        >
          <div
            className="h-full rounded-full bg-nada-600 transition-[width] duration-200"
            style={{ width: `${Math.round(progres * 100)}%` }}
          />
        </div>
      )}
      <p className="text-sm text-redup">
        {KETERANGAN_TAHAP[tahap]}
        {progres !== undefined && ` ${Math.round(progres * 100)}%`}
      </p>
    </div>
  );
}

type Props = {
  rekaman: HasilRekaman | null;
  keadaan: KeadaanAnalisis;
  onAnalisis: () => void;
  onCobaLagi: () => void;
  onRekamUlang: () => void;
  hasil?: React.ReactNode;
};

export function PanelAnalisis({
  rekaman,
  keadaan,
  onAnalisis,
  onCobaLagi,
  onRekamUlang,
  hasil,
}: Props) {
  if (!rekaman) {
    return (
      <EmptyState
        ringkas
        ikon={Sparkles}
        judul="Belum ada rekaman untuk dianalisis"
        deskripsi="Rekam nyanyian Anda terlebih dahulu, lalu tekan Analisis."
      />
    );
  }

  const rekamanTidakValid = rekaman.terlaluPendek || rekaman.tanpaSuara;

  if (keadaan.tahap === "siap") {
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          ukuran="lg"
          onClick={onAnalisis}
          disabled={rekamanTidakValid}
          ikon={<Sparkles className="size-5" aria-hidden="true" />}
        >
          Analisis
        </Button>
        <p className="text-sm text-redup">
          {rekamanTidakValid
            ? "Rekam ulang terlebih dahulu. Rekaman ini tidak dapat dianalisis."
            : "Rekaman dianalisis langsung di perangkat Anda dan tidak diunggah ke server."}
        </p>
      </div>
    );
  }

  if (keadaan.tahap === "gagal") {
    if (keadaan.alasan === "kuota_habis") {
      return <KuotaHabis ringkas waktuReset={keadaan.waktuReset} />;
    }
    const { judul, isi, aksi } = PESAN_GAGAL[keadaan.alasan];
    return (
      <Alert
        varian={keadaan.alasan === "belum_tersambung" ? "peringatan" : "galat"}
        judul={judul}
        aksi={
          aksi === "coba_lagi" ? (
            <Button
              varian="garis"
              ukuran="sm"
              onClick={onCobaLagi}
              ikon={<RotateCw className="size-4" aria-hidden="true" />}
            >
              Coba Lagi
            </Button>
          ) : aksi === "rekam_ulang" ? (
            <Button
              varian="garis"
              ukuran="sm"
              onClick={onRekamUlang}
              ikon={<RotateCcw className="size-4" aria-hidden="true" />}
            >
              Rekam Ulang
            </Button>
          ) : undefined
        }
      >
        {keadaan.pesan ?? isi}
      </Alert>
    );
  }

  if (keadaan.tahap === "selesai") return <>{hasil}</>;

  return (
    <LangkahProses
      tahap={keadaan.tahap}
      progres={keadaan.tahap === "menganalisis" ? keadaan.progres : undefined}
    />
  );
}
