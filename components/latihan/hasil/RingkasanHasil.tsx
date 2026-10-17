"use client";

import dynamic from "next/dynamic";
import type { HasilAnalisis } from "@/lib/types";
import { DaftarNadaMeleset, TabelNada } from "./DaftarNadaMeleset";
import { SkorAkurasi } from "./SkorAkurasi";

// Chart.js hanya dimuat saat hasil analisis tampil.
const GrafikPitch = dynamic(
  () => import("./GrafikPitch").then((m) => m.GrafikPitch),
  {
    ssr: false,
    loading: () => (
      <div className="h-72 animate-pulse rounded-xl bg-nada-50 sm:h-80" />
    ),
  },
);

/**
 * Skor, grafik nada, dan daftar nada meleset. Dipakai di halaman hasil
 * latihan (UC-13) dan detail riwayat (UC-14).
 */
export function RingkasanHasil({ hasil }: { hasil: HasilAnalisis }) {
  return (
    <>
      <SkorAkurasi skor={hasil.skor} />

      <section aria-labelledby="judul-grafik" className="flex flex-col gap-3">
        <h3 id="judul-grafik" className="font-bold text-tinta">
          Grafik nada
        </h3>
        <GrafikPitch
          acuan={hasil.acuan}
          kontur={hasil.kontur}
          nadaMeleset={hasil.nadaMeleset}
        />
        <details className="group">
          <summary className="cursor-pointer text-sm font-semibold text-nada-700 hover:underline">
            Lihat sebagai tabel
          </summary>
          <div className="mt-3">
            <TabelNada acuan={hasil.acuan} nadaMeleset={hasil.nadaMeleset} />
          </div>
        </details>
      </section>

      <section aria-labelledby="judul-meleset" className="flex flex-col gap-3">
        <h3 id="judul-meleset" className="font-bold text-tinta">
          Nada yang meleset{" "}
          <span className="font-normal text-redup">
            ({hasil.nadaMeleset.length} dari {hasil.acuan.length} nada)
          </span>
        </h3>
        <DaftarNadaMeleset nadaMeleset={hasil.nadaMeleset} />
      </section>
    </>
  );
}
