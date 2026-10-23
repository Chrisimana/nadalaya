"use client";

import { Check, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getInfoLangganan } from "@/lib/api";
import { bolehUjiCoba } from "@/lib/statusPaket";
import { useMuat } from "@/lib/useMuat";
import { TombolUjiCoba } from "./TombolUjiCoba";

const keuntungan = [
  "Semua materi interval dan melodi",
  "Analisis tanpa batas setiap hari",
  "Grafik progres skor",
];

export function MateriTerkunci({ onUjiCobaAktif }: { onUjiCobaAktif?: () => void }) {
  const { keadaan } = useMuat(getInfoLangganan);
  const tampilkanUjiCoba = keadaan.status === "siap" && bolehUjiCoba(keadaan.data);

  return (
    <section
      aria-labelledby="judul-terkunci"
      className="overflow-hidden rounded-3xl border border-kuningan-200 bg-white"
    >
      <div className="latar-paranada flex flex-col items-center gap-3 bg-kuningan-50 px-6 pt-10 pb-8 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-white text-kuningan-600 shadow-sm ring-1 ring-kuningan-200">
          <Lock className="size-8" aria-hidden="true" />
        </span>
        <h2
          id="judul-terkunci"
          className="font-serif text-2xl font-semibold text-nada-900"
        >
          Materi ini khusus Premium
        </h2>
        <p className="max-w-md text-sm leading-relaxed text-redup">
          {tampilkanUjiCoba
            ? "Beralih ke Premium atau aktifkan uji coba gratis 7 hari untuk membuka materi ini beserta seluruh materi interval dan melodi."
            : "Beralih ke Premium untuk membuka materi ini beserta seluruh materi interval dan melodi."}
        </p>
      </div>
      <div className="flex flex-col items-center gap-6 px-6 py-8">
        <ul className="flex flex-col gap-2 text-sm text-tinta">
          {keuntungan.map((k) => (
            <li key={k} className="flex items-center gap-2">
              <Check className="size-4 text-nada-600" aria-hidden="true" />
              {k}
            </li>
          ))}
        </ul>
        <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-start">
          {tampilkanUjiCoba && (
            <TombolUjiCoba onBerhasil={() => onUjiCobaAktif?.()} className="max-w-md" />
          )}
          <Button href="/langganan" varian={tampilkanUjiCoba ? "garis" : "aksen"} ukuran="lg">
            Lihat Paket Premium
          </Button>
          <Button href="/materi" varian="garis" ukuran="lg">
            Kembali ke Daftar Materi
          </Button>
        </div>
      </div>
    </section>
  );
}
