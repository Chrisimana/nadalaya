import type { Metadata } from "next";
import { Suspense } from "react";
import { UbahMateri } from "@/components/admin/UbahMateri";
import { KepalaAplikasi } from "@/components/pengguna/KepalaAplikasi";
import { Kerangka } from "@/components/ui/Memuat";

export const metadata: Metadata = { title: "Ubah Materi" };

export default function HalamanUbahMateri({
  params,
}: PageProps<"/admin/materi/[id]/ubah">) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6">
      <KepalaAplikasi
        judul="Ubah materi"
        deskripsi="Perbarui data materi atau ganti berkas MIDI."
        kembali={{ href: "/admin/materi", label: "Kelola Materi" }}
      />
      <Suspense fallback={<Kerangka jumlah={1} tinggi="h-96" />}>
        {params.then(({ id }) => (
          <UbahMateri key={id} id={id} />
        ))}
      </Suspense>
    </div>
  );
}
