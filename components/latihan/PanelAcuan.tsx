"use client";

import { Play, RotateCw, Square } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import {
  AudioDiblokirError,
  ambilKeadaanAcuan,
  ambilKeadaanAcuanServer,
  hentikanAcuan,
  langgananAcuan,
  putarAcuan,
} from "@/lib/audio/acuan";
import type { NadaAcuan } from "@/lib/types";
import { PanelNotasi } from "./PanelNotasi";

export function useKeadaanAcuan() {
  return useSyncExternalStore(
    langgananAcuan,
    ambilKeadaanAcuan,
    ambilKeadaanAcuanServer,
  );
}

type Props = {
  nada: NadaAcuan[] | null | undefined;
  tempo?: number;
  nonaktif?: boolean;
};

export function PanelAcuan({ nada, tempo, nonaktif }: Props) {
  const { status, indeksAktif } = useKeadaanAcuan();
  const [galat, setGalat] = useState<"diblokir" | "gagal" | null>(null);
  const ada = !!nada && nada.length > 0;
  const berjalan = status !== "diam";

  // Hentikan acuan saat meninggalkan halaman latihan.
  useEffect(() => hentikanAcuan, []);

  async function putar() {
    if (!nada) return;
    setGalat(null);
    try {
      await putarAcuan(nada);
    } catch (err) {
      setGalat(err instanceof AudioDiblokirError ? "diblokir" : "gagal");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PanelNotasi nada={nada} tempo={tempo} indeksAktif={indeksAktif} />

      {galat === "diblokir" && (
        <Alert varian="peringatan" judul="Audio diblokir browser">
          Browser belum mengizinkan situs ini memutar suara. Klik tombol Putar
          Acuan sekali lagi. Jika tetap tidak berbunyi, buka pengaturan situs
          (ikon gembok di bilah alamat) lalu izinkan <strong>Suara</strong>.
        </Alert>
      )}
      {galat === "gagal" && (
        <Alert
          varian="galat"
          judul="Acuan gagal dimuat"
          aksi={
            <Button
              varian="garis"
              ukuran="sm"
              ikon={<RotateCw className="size-4" aria-hidden="true" />}
              onClick={putar}
            >
              Muat Ulang
            </Button>
          }
        >
          Periksa koneksi internet Anda, lalu coba lagi.
        </Alert>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {berjalan ? (
          <Button
            varian="garis"
            onClick={hentikanAcuan}
            ikon={<Square className="size-4 fill-current" aria-hidden="true" />}
          >
            Berhenti
          </Button>
        ) : (
          <Button
            onClick={putar}
            disabled={!ada || nonaktif}
            ikon={<Play className="size-4 fill-current" aria-hidden="true" />}
          >
            Putar Acuan
          </Button>
        )}
        <p className="text-sm text-redup" aria-live="polite">
          {status === "menyiapkan" && "Menyiapkan audio…"}
          {status === "memutar" && "Acuan sedang diputar."}
          {status === "diam" &&
            (nonaktif
              ? "Acuan tidak dapat diputar selama perekaman."
              : !ada
                ? "Acuan dapat diputar setelah data nada tersedia."
                : "Gunakan headphone agar acuan tidak terekam.")}
        </p>
      </div>
    </div>
  );
}
