import type { Metadata } from "next";
import { Suspense } from "react";
import { DetailRiwayat } from "@/components/riwayat/DetailRiwayat";
import { Kerangka } from "@/components/ui/Memuat";

export const metadata: Metadata = { title: "Detail Riwayat" };

export default function HalamanDetailRiwayat({
  params,
}: PageProps<"/riwayat/[id]">) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
          <Kerangka jumlah={3} tinggi="h-40" />
        </div>
      }
    >
      {params.then(({ id }) => (
        <DetailRiwayat key={id} id={id} />
      ))}
    </Suspense>
  );
}
