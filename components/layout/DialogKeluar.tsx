"use client";

import { useState } from "react";
import { DialogKonfirmasi } from "@/components/ui/DialogKonfirmasi";
import { logout } from "@/lib/api";

/**
 * UC-04 Keluar dari Sistem dengan konfirmasi. Jika permintaan ke server gagal
 * (misalnya koneksi terputus), sesi di browser tetap dianggap berakhir dan
 * pengguna diarahkan ke beranda.
 */
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
      // Abaikan: cookie sesi akan kedaluwarsa sendiri dan proxy.ts
      // tetap meminta masuk ulang bila sesi tidak valid.
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
