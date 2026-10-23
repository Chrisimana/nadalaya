"use client";

import { Clock4, Crown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  formatSisaWaktu,
  formatWaktuWib,
  resetKuotaBerikutnya,
} from "@/lib/waktu";

export function KuotaHabis({
  waktuReset,
  ringkas,
}: {
  waktuReset?: string;
  ringkas?: boolean;
}) {
  const reset = useMemo(
    () => (waktuReset ? new Date(waktuReset) : resetKuotaBerikutnya()),
    [waktuReset],
  );
  const [sekarang, setSekarang] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setSekarang(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const sisa = formatSisaWaktu(reset.getTime() - sekarang);

  if (ringkas) {
    return (
      <div
        role="alert"
        className="flex flex-col gap-3 rounded-xl border border-kuningan-200 bg-kuningan-50 p-4 text-sm"
      >
        <p className="font-semibold text-kuningan-700">
          Kuota analisis hari ini sudah habis
        </p>
        <p className="text-tinta">
          Kuota diperbarui pukul 00.00 WIB (dalam {sisa}). Rekaman Anda tidak
          dianalisis dan kuota tidak berkurang.
        </p>
        <Button href="/harga" varian="aksen" ukuran="sm" className="self-start">
          Analisis Tanpa Batas dengan Premium
        </Button>
      </div>
    );
  }

  return (
    <section
      aria-labelledby="judul-kuota"
      className="flex flex-col items-center gap-4 rounded-3xl border border-garis bg-white px-6 py-12 text-center"
    >
      <span className="flex size-16 items-center justify-center rounded-full bg-nada-50 text-nada-600 ring-1 ring-nada-100">
        <Clock4 className="size-8" aria-hidden="true" />
      </span>
      <h2
        id="judul-kuota"
        className="font-serif text-2xl font-semibold text-nada-900"
      >
        Kuota analisis hari ini sudah habis
      </h2>
      <p className="max-w-md text-sm leading-relaxed text-redup">
        Paket Gratis mendapat 3 analisis per hari. Kuota Anda diperbarui pada{" "}
        <strong className="text-tinta">{formatWaktuWib(reset)}</strong>.
      </p>
      <p className="rounded-full bg-nada-50 px-4 py-1.5 text-sm font-semibold text-nada-700">
        Tersisa {sisa} lagi
      </p>
      <div className="mt-2 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Button
          href="/harga"
          varian="aksen"
          ukuran="lg"
          ikon={<Crown className="size-5" aria-hidden="true" />}
        >
          Analisis Tanpa Batas
        </Button>
        <Button href="/dashboard" varian="garis" ukuran="lg">
          Kembali ke Dashboard
        </Button>
      </div>
    </section>
  );
}
