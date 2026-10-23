"use client";

import { Crown, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { adalahBelumTersambung, aktifkanUjiCoba, pesanGalat } from "@/lib/api";

type Props = {
  judul?: string;
  deskripsi?: string;
};

export function AjakanUpgrade({
  judul = "Riwayat latihan khusus Premium",
  deskripsi = "Riwayat latihan dan grafik progres tersedia di paket Premium atau Uji Coba Premium 7 hari. Skor dan grafik nada tetap tampil setiap kali Anda selesai berlatih.",
}: Props) {
  const router = useRouter();
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState<{
    pesan: string;
    belumTersambung: boolean;
  } | null>(null);

  // Aktifkan uji coba langsung dari ajakan ini.
  async function cobaPremium() {
    setGalat(null);
    setMemuat(true);
    try {
      await aktifkanUjiCoba();
      router.refresh();
    } catch (err) {
      setGalat({
        pesan: pesanGalat(err),
        belumTersambung: adalahBelumTersambung(err),
      });
    } finally {
      setMemuat(false);
    }
  }

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
        {galat && (
          <Alert
            varian={galat.belumTersambung ? "peringatan" : "galat"}
            judul="Uji coba belum dapat diaktifkan"
            className="w-full max-w-md"
          >
            {galat.pesan}
          </Alert>
        )}
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Button href="/harga" varian="garis" ukuran="lg">
            Lihat Paket
          </Button>
          <Button
            varian="aksen"
            ukuran="lg"
            onClick={cobaPremium}
            memuat={memuat}
            ikon={<Crown className="size-5" aria-hidden="true" />}
          >
            Coba Premium 7 Hari
          </Button>
        </div>
        <p className="text-xs text-redup">
          Uji coba gratis hanya dapat diaktifkan satu kali per akun.
        </p>
      </div>
    </section>
  );
}
