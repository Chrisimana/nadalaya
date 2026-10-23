import type { Metadata } from "next";
import { Suspense } from "react";
import { KelolaMateri } from "@/components/admin/KelolaMateri";

export const metadata: Metadata = { title: "Kelola Materi" };

export default function HalamanKelolaMateri({ searchParams }: PageProps<"/admin/materi">) {
  return (
    <Suspense fallback={<KelolaMateri />}>
      {searchParams.then((sp) => (
        <KelolaMateri
          disimpan={sp.disimpan === "tambah" || sp.disimpan === "ubah" ? sp.disimpan : null}
        />
      ))}
    </Suspense>
  );
}
