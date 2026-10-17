"use client";

import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [keluar, setKeluar] = useState(false);

  async function jalankan() {
    setKeluar(true);
    try {
      await logout();
    } catch {
      // TODO: sambungkan ke Supabase — hapus sesi lokal bila server tidak terjangkau.
    }
    router.replace("/");
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
