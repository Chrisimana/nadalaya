"use client";

import { useState } from "react";
import { DialogKonfirmasi } from "@/components/ui/DialogKonfirmasi";
import { logout } from "@/lib/api";

export function DialogKeluar({
  terbuka,
  onTutup,
}: {
  terbuka: boolean;
  onTutup: () => void;
}) {
  const [keluar, setKeluar] = useState(false);

  async function jalankan() {
    setKeluar(true);
    try {
      await logout();
    } catch {
      // Abaikan: proxy.ts tetap meminta masuk ulang bila sesi tidak valid.
    }
    // Muat ulang penuh agar data pengguna di memori ikut terhapus.
    window.location.replace("/");
  }

  return (
    <DialogKonfirmasi
      terbuka={terbuka}
      judul="Keluar dari Nadalaya?"
      labelKonfirmasi="Keluar"
      memuat={keluar}
      onKonfirmasi={jalankan}
      onBatal={onTutup}
    >
      Anda perlu masuk kembali untuk melanjutkan latihan.
    </DialogKonfirmasi>
  );
}
