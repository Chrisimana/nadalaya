"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { hentikanAcuan } from "./acuan";
import {
  GalatMikrofon,
  PerekamSuara,
  type HasilRekaman,
  type JenisGalatMikrofon,
} from "./recorder";

export type StatusPerekam =
  | "siap"
  | "meminta_izin"
  | "merekam"
  | "memproses"
  | "selesai"
  | "galat";

export type KeadaanPerekam = {
  status: StatusPerekam;
  /** Durasi berjalan (detik) selama merekam. */
  durasi: number;
  /** Level suara 0–1 selama merekam. */
  level: number;
  hasil: HasilRekaman | null;
  galat: JenisGalatMikrofon | null;
};

const AWAL: KeadaanPerekam = {
  status: "siap",
  durasi: 0,
  level: 0,
  hasil: null,
  galat: null,
};

/** Hook React untuk PerekamSuara: status, level, timer, dan hasil rekaman. */
export function usePerekam() {
  const [keadaan, setKeadaan] = useState<KeadaanPerekam>(AWAL);
  const perekam = useRef<PerekamSuara | null>(null);
  const bingkai = useRef<number | null>(null);

  const hentikanAnimasi = useCallback(() => {
    if (bingkai.current !== null) cancelAnimationFrame(bingkai.current);
    bingkai.current = null;
  }, []);

  const selesai = useCallback(
    (hasil: HasilRekaman) => {
      hentikanAnimasi();
      perekam.current = null;
      setKeadaan({ ...AWAL, status: "selesai", durasi: hasil.durasi, hasil });
    },
    [hentikanAnimasi],
  );

  const mulai = useCallback(async () => {
    if (perekam.current) return;
    // FR-10: acuan tidak boleh berbunyi selama perekaman.
    hentikanAcuan();
    setKeadaan({ ...AWAL, status: "meminta_izin" });

    const p = new PerekamSuara();
    p.onBerhentiOtomatis = selesai;
    perekam.current = p;
    try {
      await p.mulai();
    } catch (err) {
      perekam.current = null;
      setKeadaan({
        ...AWAL,
        status: "galat",
        galat: err instanceof GalatMikrofon ? err.jenis : "lainnya",
      });
      return;
    }
    if (perekam.current !== p) {
      // Dibatalkan saat menunggu izin: lepaskan lagi mikrofonnya.
      p.batalkan();
      return;
    }

    setKeadaan({ ...AWAL, status: "merekam" });
    const perbarui = () => {
      if (perekam.current !== p) return;
      setKeadaan((k) =>
        k.status === "merekam"
          ? { ...k, durasi: p.durasi, level: p.level }
          : k,
      );
      bingkai.current = requestAnimationFrame(perbarui);
    };
    bingkai.current = requestAnimationFrame(perbarui);
  }, [selesai]);

  const berhenti = useCallback(async () => {
    const p = perekam.current;
    if (!p) return;
    hentikanAnimasi();
    setKeadaan((k) => ({ ...k, status: "memproses", level: 0 }));
    try {
      selesai(await p.berhenti());
    } catch {
      perekam.current = null;
      setKeadaan({ ...AWAL, status: "galat", galat: "lainnya" });
    }
  }, [hentikanAnimasi, selesai]);

  /** Membuang rekaman dan kembali ke keadaan siap merekam. */
  const ulang = useCallback(() => {
    hentikanAnimasi();
    perekam.current?.batalkan();
    perekam.current = null;
    setKeadaan(AWAL);
  }, [hentikanAnimasi]);

  // Lepaskan mikrofon saat halaman ditinggalkan atau disembunyikan.
  useEffect(
    () => () => {
      if (perekam.current) {
        hentikanAnimasi();
        perekam.current.batalkan();
        perekam.current = null;
        setKeadaan(AWAL);
      }
    },
    [hentikanAnimasi],
  );

  return { ...keadaan, mulai, berhenti, ulang };
}

export type Perekam = ReturnType<typeof usePerekam>;
