"use client";

import { useState } from "react";
import { keGalatServer, type GalatServer } from "@/components/ui/AlertServer";
import { DialogKonfirmasi } from "@/components/ui/DialogKonfirmasi";
import { nonaktifkanPengguna } from "@/lib/api";

/** UC-25 Menonaktifkan Akun Pengguna dengan konfirmasi. */
export function DialogNonaktifkan({
  pengguna,
  onTutup,
  onBerhasil,
  onGalat,
}: {
  pengguna: { id: string; nama: string } | null;
  onTutup: () => void;
  onBerhasil: (nama: string) => void;
  onGalat: (galat: GalatServer) => void;
}) {
  const [memuat, setMemuat] = useState(false);

  async function jalankan() {
    if (!pengguna) return;
    setMemuat(true);
    try {
      await nonaktifkanPengguna(pengguna.id);
      onBerhasil(pengguna.nama);
    } catch (err) {
      onGalat(keGalatServer(err));
    } finally {
      setMemuat(false);
      onTutup();
    }
  }

  return (
    <DialogKonfirmasi
      terbuka={pengguna !== null}
      judul="Nonaktifkan akun ini?"
      labelKonfirmasi="Nonaktifkan"
      memuat={memuat}
      onKonfirmasi={jalankan}
      onBatal={onTutup}
    >
      Akun <strong className="text-tinta">{pengguna?.nama}</strong> tidak akan
      dapat masuk ke Nadalaya dan seluruh sesi aktifnya akan diakhiri. Data
      latihan dan transaksi tetap tersimpan.
    </DialogKonfirmasi>
  );
}
