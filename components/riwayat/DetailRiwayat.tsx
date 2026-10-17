"use client";

import { RotateCcw, SearchX } from "lucide-react";
import { useCallback } from "react";
import { KhususPremium } from "@/components/akses/KhususPremium";
import { RingkasanHasil } from "@/components/latihan/hasil/RingkasanHasil";
import { KepalaAplikasi } from "@/components/pengguna/KepalaAplikasi";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { GagalMuat, Kerangka } from "@/components/ui/Memuat";
import { getRiwayatById } from "@/lib/api";
import { LABEL_JENIS } from "@/lib/types";
import { useMuat } from "@/lib/useMuat";
import { formatTanggal } from "@/lib/waktu";

function IsiDetail({ id }: { id: string }) {
  const ambil = useCallback(() => getRiwayatById(id), [id]);
  const { keadaan, muatUlang } = useMuat(ambil);

  if (keadaan.status === "memuat") return <Kerangka jumlah={3} tinggi="h-40" />;
  if (keadaan.status === "galat") {
    return <GagalMuat judul="Detail riwayat gagal dimuat" pesan={keadaan.pesan} onMuatUlang={muatUlang} />;
  }
  if (!keadaan.data) {
    return (
      <EmptyState
        ikon={SearchX}
        judul="Riwayat tidak ditemukan"
        deskripsi="Riwayat latihan ini tidak tersedia atau bukan milik akun Anda."
        aksi={<Button href="/riwayat">Kembali ke Riwayat</Button>}
      />
    );
  }

  const r = keadaan.data;
  return (
    <Card className="flex flex-col gap-7">
      <div className="flex flex-col gap-3 border-b border-garis pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-lg font-bold text-tinta">{r.judulMateri}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-redup">
            <Badge varian="nada">{LABEL_JENIS[r.jenis]}</Badge>
            {formatTanggal(r.tanggal, { denganJam: true })}
          </div>
        </div>
        <Button
          href={`/latihan/${r.materiId}`}
          varian="garis"
          ikon={<RotateCcw className="size-4" aria-hidden="true" />}
        >
          Latih Lagi
        </Button>
      </div>
      <RingkasanHasil hasil={r.hasil} />
    </Card>
  );
}

/** UC-14 langkah 2: detail skor dan grafik nada satu riwayat. */
export function DetailRiwayat({ id }: { id: string }) {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6">
      <KepalaAplikasi
        judul="Detail latihan"
        kembali={{ href: "/riwayat", label: "Riwayat Latihan" }}
      />
      <KhususPremium>
        <IsiDetail id={id} />
      </KhususPremium>
    </div>
  );
}
