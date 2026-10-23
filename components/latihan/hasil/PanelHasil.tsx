"use client";

import { ListMusic, RotateCcw } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import type { HasilAnalisis } from "@/lib/types";
import { RingkasanHasil } from "./RingkasanHasil";

type Props = {
  hasil: HasilAnalisis;
  riwayatTersimpan: boolean;
  onLatihLagi: () => void;
};

export function PanelHasil({ hasil, riwayatTersimpan, onLatihLagi }: Props) {
  return (
    <div className="flex flex-col gap-7">
      {!riwayatTersimpan && (
        <Alert varian="peringatan" judul="Riwayat gagal disimpan">
          Skor tetap ditampilkan, tetapi latihan ini tidak tercatat di riwayat
          dan tidak dihitung sebagai kuota.
        </Alert>
      )}

      <RingkasanHasil hasil={hasil} />

      <div className="flex flex-col gap-3 border-t border-garis pt-6 sm:flex-row">
        <Button
          ukuran="lg"
          onClick={onLatihLagi}
          ikon={<RotateCcw className="size-5" aria-hidden="true" />}
        >
          Latih Lagi
        </Button>
        <Button
          href="/materi"
          ukuran="lg"
          varian="garis"
          ikon={<ListMusic className="size-5" aria-hidden="true" />}
        >
          Kembali ke Daftar Materi
        </Button>
      </div>
    </div>
  );
}
