import type { Metadata } from "next";
import { FormMateri } from "@/components/admin/FormMateri";
import { KepalaAplikasi } from "@/components/pengguna/KepalaAplikasi";

export const metadata: Metadata = { title: "Tambah Materi" };

export default function HalamanTambahMateri() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6">
      <KepalaAplikasi
        judul="Tambah materi"
        deskripsi="Isi data materi dan unggah berkas MIDI. Notasi balok dibuat otomatis dari berkas tersebut."
        kembali={{ href: "/admin/materi", label: "Kelola Materi" }}
      />
      <FormMateri />
    </div>
  );
}
