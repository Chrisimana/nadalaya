"use client";

import type { ReactNode } from "react";
import { GagalMuat, Kerangka } from "@/components/ui/Memuat";
import { getStatusPaket } from "@/lib/api";
import { useMuat } from "@/lib/useMuat";
import { AjakanUpgrade } from "./AjakanUpgrade";

/**
 * Menampilkan isi hanya untuk pengguna Premium, Paket Persiapan Tes, dan
 * Uji Coba. Pengguna Gratis melihat ajakan upgrade. Server tetap memeriksa
 * ulang hak akses saat data diminta.
 */
export function KhususPremium({
  judul,
  deskripsi,
  children,
}: {
  judul?: string;
  deskripsi?: string;
  children: ReactNode;
}) {
  const { keadaan, muatUlang } = useMuat(getStatusPaket);

  if (keadaan.status === "memuat") return <Kerangka jumlah={3} />;
  if (keadaan.status === "galat") {
    return (
      <GagalMuat judul="Status paket gagal dimuat" pesan={keadaan.pesan} onMuatUlang={muatUlang} />
    );
  }
  if (keadaan.data === "gratis") {
    return <AjakanUpgrade judul={judul} deskripsi={deskripsi} />;
  }
  return <>{children}</>;
}
