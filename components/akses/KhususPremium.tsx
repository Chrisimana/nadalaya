"use client";

import type { ReactNode } from "react";
import { GagalMuat, Kerangka } from "@/components/ui/Memuat";
import { getStatusPaketDanKuota } from "@/lib/api";
import { bolehUjiCoba } from "@/lib/statusPaket";
import { useMuat } from "@/lib/useMuat";
import { AjakanUpgrade } from "./AjakanUpgrade";

export function KhususPremium({
  judul,
  deskripsi,
  children,
}: {
  judul?: string;
  deskripsi?: string;
  children: ReactNode;
}) {
  const { keadaan, muatUlang } = useMuat(getStatusPaketDanKuota);

  if (keadaan.status === "memuat") return <Kerangka jumlah={3} />;
  if (keadaan.status === "galat") {
    return (
      <GagalMuat judul="Status paket gagal dimuat" pesan={keadaan.pesan} onMuatUlang={muatUlang} />
    );
  }
  if (keadaan.data.statusPaket === "gratis") {
    return (
      <AjakanUpgrade
        judul={judul}
        deskripsi={deskripsi}
        bolehUjiCoba={bolehUjiCoba(keadaan.data)}
        onUjiCobaAktif={muatUlang}
      />
    );
  }
  return <>{children}</>;
}
