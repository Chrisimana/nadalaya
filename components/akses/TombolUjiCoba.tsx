"use client";

import { Crown } from "lucide-react";
import { useRef, useState } from "react";
import { AlertServer, keGalatServer, type GalatServer } from "@/components/ui/AlertServer";
import { Button } from "@/components/ui/Button";
import { aktifkanUjiCoba } from "@/lib/api";
import { cn } from "@/lib/utils";

export function TombolUjiCoba({
  onBerhasil,
  ukuran = "lg",
  className,
}: {
  onBerhasil: (tanggalBerakhir: string) => void;
  ukuran?: "sm" | "md" | "lg";
  className?: string;
}) {
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState<GalatServer | null>(null);
  // Mencegah dua klik beruntun mengirim dua permintaan.
  const berjalan = useRef(false);

  async function aktifkan() {
    if (berjalan.current) return;
    berjalan.current = true;
    setGalat(null);
    setMemuat(true);
    try {
      const { tanggalBerakhir } = await aktifkanUjiCoba();
      onBerhasil(tanggalBerakhir);
    } catch (err) {
      setGalat(keGalatServer(err));
    } finally {
      berjalan.current = false;
      setMemuat(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <Button
        varian="aksen"
        ukuran={ukuran}
        onClick={aktifkan}
        memuat={memuat}
        ikon={<Crown className="size-5" aria-hidden="true" />}
      >
        Coba Premium 7 Hari
      </Button>
      <AlertServer galat={galat} judul="Uji coba belum dapat diaktifkan" className="text-left" />
    </div>
  );
}
