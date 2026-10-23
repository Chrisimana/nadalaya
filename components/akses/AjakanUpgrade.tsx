"use client";

import { Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TombolUjiCoba } from "./TombolUjiCoba";

type Props = {
  judul?: string;
  deskripsi?: string;
  bolehUjiCoba?: boolean;
  onUjiCobaAktif?: () => void;
};

export function AjakanUpgrade({
  judul = "Riwayat latihan khusus Premium",
  deskripsi = "Riwayat latihan dan grafik progres tersedia di paket Premium atau Uji Coba Premium 7 hari. Skor dan grafik nada tetap tampil setiap kali Anda selesai berlatih.",
  bolehUjiCoba = false,
  onUjiCobaAktif,
}: Props) {
  return (
    <section
      aria-labelledby="judul-ajakan-upgrade"
      className="overflow-hidden rounded-3xl border border-kuningan-200 bg-white"
    >
      <div className="latar-paranada flex flex-col items-center gap-3 bg-kuningan-50 px-6 pt-10 pb-8 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-white text-kuningan-600 shadow-sm ring-1 ring-kuningan-200">
          <Lock className="size-8" aria-hidden="true" />
        </span>
        <h2
          id="judul-ajakan-upgrade"
          className="font-serif text-2xl font-semibold text-nada-900"
        >
          {judul}
        </h2>
        <p className="max-w-md text-sm leading-relaxed text-redup">
          {deskripsi}
        </p>
      </div>
      <div className="flex flex-col items-center gap-4 px-6 py-8">
        <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-start">
          <Button href="/langganan" varian={bolehUjiCoba ? "garis" : "aksen"} ukuran="lg">
            Lihat Paket Premium
          </Button>
          {bolehUjiCoba && <TombolUjiCoba onBerhasil={() => onUjiCobaAktif?.()} className="max-w-md" />}
        </div>
        {bolehUjiCoba && (
          <p className="text-xs text-redup">
            Uji coba gratis hanya dapat diaktifkan satu kali per akun.
          </p>
        )}
      </div>
    </section>
  );
}
