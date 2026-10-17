import type { Metadata } from "next";
import { Suspense } from "react";
import { RuangLatihan } from "@/components/latihan/RuangLatihan";

export const metadata: Metadata = { title: "Latihan" };

function KerangkaLatihan() {
  return (
    <div
      className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6"
      aria-busy="true"
      aria-label="Memuat halaman latihan"
    >
      <div className="h-9 w-64 animate-pulse rounded-lg bg-nada-100" />
      {Array.from({ length: 3 }, (_, i) => (
        <div
          key={i}
          className="h-48 animate-pulse rounded-2xl border border-garis bg-white"
        />
      ))}
    </div>
  );
}

// UC-08 Memilih Materi Latihan. Nilai `id` baru diketahui saat permintaan,
// sehingga aksesnya dibungkus Suspense (Cache Components).
export default function HalamanLatihan({ params }: PageProps<"/latihan/[id]">) {
  return (
    <Suspense fallback={<KerangkaLatihan />}>
      {params.then(({ id }) => (
        <RuangLatihan key={id} materiId={id} />
      ))}
    </Suspense>
  );
}
