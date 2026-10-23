"use client";

import { Mic, RotateCcw, Square } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { DURASI_MAKS, DURASI_MIN, type JenisGalatMikrofon } from "@/lib/audio/recorder";
import type { Perekam } from "@/lib/audio/usePerekam";
import { cn } from "@/lib/utils";
import { formatDurasi } from "@/lib/waktu";
import { IndikatorLevel } from "./IndikatorLevel";
import { PemutarRekaman } from "./PemutarRekaman";

const PESAN_GALAT: Record<
  JenisGalatMikrofon,
  { judul: string; isi: React.ReactNode }
> = {
  ditolak: {
    judul: "Izin mikrofon ditolak",
    isi: (
      <ol className="mt-1 list-decimal space-y-1 pl-5">
        <li>
          Klik ikon gembok atau ikon pengaturan di sebelah kiri bilah alamat
          browser.
        </li>
        <li>
          Ubah izin <strong>Mikrofon</strong> menjadi <strong>Izinkan</strong>.
        </li>
        <li>Muat ulang halaman, lalu tekan tombol Rekam lagi.</li>
      </ol>
    ),
  },
  tidak_ditemukan: {
    judul: "Mikrofon tidak ditemukan",
    isi: "Pastikan mikrofon atau headset sudah terpasang, lalu coba lagi.",
  },
  sedang_dipakai: {
    judul: "Mikrofon sedang dipakai aplikasi lain",
    isi: "Tutup aplikasi lain yang memakai mikrofon (misalnya aplikasi rapat daring), lalu coba lagi.",
  },
  tidak_aman: {
    judul: "Koneksi tidak aman",
    isi: "Perekaman hanya dapat dilakukan melalui koneksi HTTPS. Buka Nadalaya melalui alamat yang diawali https://.",
  },
  tidak_didukung: {
    judul: "Browser tidak mendukung perekaman",
    isi: "Gunakan Google Chrome, Microsoft Edge, atau Mozilla Firefox versi terbaru.",
  },
  lainnya: {
    judul: "Perekaman gagal",
    isi: "Terjadi kesalahan saat mengakses mikrofon. Silakan coba lagi.",
  },
};

export function PerekamSuara({
  perekam,
  terkunci,
}: {
  perekam: Perekam;
  terkunci?: boolean;
}) {
  const { status, durasi, level, hasil, galat, mulai, berhenti, ulang } =
    perekam;
  const merekam = status === "merekam";
  const persen = Math.min(100, (durasi / DURASI_MAKS) * 100);
  const sisa = DURASI_MAKS - durasi;

  return (
    <div className="flex flex-col gap-5">
      {galat && (
        <Alert
          varian={galat === "ditolak" ? "peringatan" : "galat"}
          judul={PESAN_GALAT[galat].judul}
          aksi={
            <Button
              varian="garis"
              ukuran="sm"
              onClick={mulai}
              ikon={<Mic className="size-4" aria-hidden="true" />}
            >
              Coba Lagi
            </Button>
          }
        >
          {PESAN_GALAT[galat].isi}
        </Alert>
      )}

      <div
        className={cn(
          "flex flex-col items-center gap-5 rounded-2xl border p-5 sm:flex-row sm:p-6",
          merekam ? "border-red-200 bg-red-50/40" : "border-garis bg-krem/60",
        )}
      >
        <div className="flex flex-col items-center gap-2">
          {merekam || status === "memproses" ? (
            <button
              type="button"
              onClick={berhenti}
              disabled={status === "memproses"}
              className="relative flex size-20 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-400 disabled:opacity-70"
            >
              {merekam && (
                <span className="absolute inset-0 animate-ping rounded-full bg-red-500/40" />
              )}
              {status === "memproses" ? (
                <Spinner className="size-6" />
              ) : (
                <Square className="relative size-7 fill-current" aria-hidden="true" />
              )}
              <span className="sr-only">Berhenti merekam</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={hasil ? undefined : mulai}
              disabled={status === "meminta_izin" || !!hasil}
              className="flex size-20 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-400 disabled:cursor-not-allowed disabled:bg-red-300 disabled:hover:scale-100"
            >
              {status === "meminta_izin" ? (
                <Spinner className="size-6" />
              ) : (
                <Mic className="size-8" aria-hidden="true" />
              )}
              <span className="sr-only">Mulai merekam</span>
            </button>
          )}
          <span className="text-sm font-semibold text-tinta">
            {merekam
              ? "Berhenti"
              : status === "memproses"
                ? "Menyimpan…"
                : status === "meminta_izin"
                  ? "Meminta izin…"
                  : hasil
                    ? "Selesai"
                    : "Rekam"}
          </span>
        </div>

        <div className="flex w-full min-w-0 flex-1 flex-col gap-3">
          <div className="flex items-baseline justify-between gap-2">
            <p
              className="font-mono text-3xl font-semibold text-tinta tabular-nums"
              aria-live="off"
            >
              {formatDurasi(durasi)}
              <span className="text-base font-normal text-redup">
                {" "}
                / {formatDurasi(DURASI_MAKS)}
              </span>
            </p>
            {merekam && (
              <span className="flex items-center gap-1.5 text-sm font-semibold text-red-600">
                <span className="size-2 animate-pulse rounded-full bg-red-600" />
                Merekam
              </span>
            )}
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-nada-100"
            role="progressbar"
            aria-label="Durasi rekaman"
            aria-valuemin={0}
            aria-valuemax={DURASI_MAKS}
            aria-valuenow={Math.round(durasi)}
          >
            <div
              className={cn(
                "h-full rounded-full",
                sisa <= 10 && merekam ? "bg-red-500" : "bg-nada-600",
              )}
              style={{ width: `${persen}%` }}
            />
          </div>
          <IndikatorLevel level={level} aktif={merekam} />
          <p className="text-sm text-redup" aria-live="polite">
            {status === "siap" &&
              "Tekan Rekam lalu nyanyikan materi. Acuan otomatis berhenti saat perekaman dimulai."}
            {status === "meminta_izin" &&
              "Izinkan akses mikrofon pada jendela yang muncul di browser."}
            {merekam &&
              (sisa <= 10
                ? `Perekaman berhenti otomatis dalam ${Math.ceil(sisa)} detik.`
                : "Bernyanyilah dengan jelas. Batang hijau menandakan suara terdengar dengan baik.")}
            {status === "selesai" && hasil && `Rekaman tersimpan sementara di browser (${formatDurasi(hasil.durasi)}).`}
            {status === "galat" && "Perekaman belum dapat dimulai."}
          </p>
        </div>
      </div>

      {hasil && (
        <div className="flex flex-col gap-3">
          {hasil.berhentiOtomatis && (
            <Alert varian="info" judul="Perekaman dihentikan otomatis">
              Rekaman mencapai batas {DURASI_MAKS} detik.
            </Alert>
          )}
          {hasil.terlaluPendek ? (
            <Alert varian="peringatan" judul="Rekaman terlalu pendek">
              Rekaman kurang dari {DURASI_MIN} detik. Silakan rekam ulang. Kuota
              analisis Anda tidak berkurang.
            </Alert>
          ) : (
            hasil.tanpaSuara && (
              <Alert varian="peringatan" judul="Suara tidak terdeteksi">
                Rekaman terlalu pelan atau tanpa suara. Dekatkan mikrofon, lalu
                rekam ulang. Kuota analisis Anda tidak berkurang.
              </Alert>
            )
          )}
          <div className="flex flex-wrap gap-3">
            <PemutarRekaman blob={hasil.blob} />
            <Button
              varian="hantu"
              onClick={ulang}
              disabled={terkunci}
              ikon={<RotateCcw className="size-4" aria-hidden="true" />}
            >
              Rekam Ulang
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
