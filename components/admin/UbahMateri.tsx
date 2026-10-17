"use client";

import { SearchX } from "lucide-react";
import { useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { GagalMuat, Kerangka } from "@/components/ui/Memuat";
import { getMateriAdminById } from "@/lib/api";
import { useMuat } from "@/lib/useMuat";
import { FormMateri } from "./FormMateri";

/** UC-22 Mengubah Data Materi: memuat data lalu menampilkan formulir. */
export function UbahMateri({ id }: { id: string }) {
  const ambil = useCallback(() => getMateriAdminById(id), [id]);
  const { keadaan, muatUlang } = useMuat(ambil);

  if (keadaan.status === "memuat") return <Kerangka jumlah={1} tinggi="h-96" />;
  if (keadaan.status === "galat") {
    return <GagalMuat judul="Materi gagal dimuat" pesan={keadaan.pesan} onMuatUlang={muatUlang} />;
  }
  if (!keadaan.data) {
    return (
      <EmptyState
        ikon={SearchX}
        judul="Materi tidak ditemukan"
        deskripsi="Materi ini tidak tersedia atau sudah dihapus."
        aksi={<Button href="/admin/materi">Kembali ke Kelola Materi</Button>}
      />
    );
  }
  return <FormMateri materi={keadaan.data} />;
}
