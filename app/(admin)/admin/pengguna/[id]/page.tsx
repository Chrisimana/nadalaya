import type { Metadata } from "next";
import { Suspense } from "react";
import { DetailPengguna } from "@/components/admin/DetailPengguna";
import { KepalaAplikasi } from "@/components/pengguna/KepalaAplikasi";
import { Kerangka } from "@/components/ui/Memuat";

export const metadata: Metadata = { title: "Detail Pengguna" };

export default function HalamanDetailPengguna({
  params,
}: PageProps<"/admin/pengguna/[id]">) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6">
      <KepalaAplikasi
        judul="Detail pengguna"
        kembali={{ href: "/admin/pengguna", label: "Kelola Pengguna" }}
      />
      <Suspense fallback={<Kerangka jumlah={1} tinggi="h-72" />}>
        {params.then(({ id }) => (
          <DetailPengguna key={id} id={id} />
        ))}
      </Suspense>
    </div>
  );
}
