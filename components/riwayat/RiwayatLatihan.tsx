"use client";

import { ChevronRight, History } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { KhususPremium } from "@/components/akses/KhususPremium";
import { KepalaAplikasi } from "@/components/pengguna/KepalaAplikasi";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { GagalMuat, Kerangka } from "@/components/ui/Memuat";
import { getRiwayatList } from "@/lib/api";
import { LABEL_JENIS } from "@/lib/types";
import { useMuat } from "@/lib/useMuat";
import { formatTanggal } from "@/lib/waktu";

function TabelRiwayat() {
  const router = useRouter();
  const { keadaan, muatUlang } = useMuat(getRiwayatList);

  if (keadaan.status === "memuat") return <Kerangka jumlah={4} tinggi="h-14" />;
  if (keadaan.status === "galat") {
    return <GagalMuat judul="Riwayat gagal dimuat" pesan={keadaan.pesan} onMuatUlang={muatUlang} />;
  }
  if (keadaan.data.length === 0) {
    return (
      <EmptyState
        ikon={History}
        judul="Belum ada latihan"
        deskripsi="Latihan yang berhasil dianalisis akan tercatat di sini."
        aksi={<Button href="/materi">Ke Daftar Materi</Button>}
      />
    );
  }

  return (
    <div className="relative overflow-x-auto rounded-2xl border border-garis bg-white">
      <table className="w-full min-w-[520px] text-sm">
        <thead className="border-b border-garis bg-nada-50/60 text-left text-xs tracking-wide text-redup uppercase">
          <tr>
            <th scope="col" className="px-5 py-3 font-semibold">Materi</th>
            <th scope="col" className="px-5 py-3 text-right font-semibold">Skor</th>
            <th scope="col" className="px-5 py-3 font-semibold">Tanggal</th>
            <th scope="col" className="w-10 px-3 py-3"><span className="sr-only">Detail</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-garis">
          {keadaan.data.map((r) => (
            <tr
              key={r.id}
              onClick={() => router.push(`/riwayat/${r.id}`)}
              className="cursor-pointer transition-colors hover:bg-nada-50/60"
            >
              <td className="px-5 py-3.5">
                <Link
                  href={`/riwayat/${r.id}`}
                  className="font-semibold text-tinta hover:text-nada-700"
                >
                  {r.judulMateri}
                </Link>
                <div className="mt-1">
                  <Badge varian="nada">{LABEL_JENIS[r.jenis]}</Badge>
                </div>
              </td>
              <td className="px-5 py-3.5 text-right font-serif text-xl font-semibold text-nada-800 tabular-nums">
                {Math.round(r.skor)}
              </td>
              <td className="px-5 py-3.5 text-redup">
                {formatTanggal(r.tanggal, { denganJam: true, ringkas: true })}
              </td>
              <td className="px-3 py-3.5 text-redup">
                <ChevronRight className="size-5" aria-hidden="true" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RiwayatLatihan() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6">
      <KepalaAplikasi
        judul="Riwayat latihan"
        deskripsi="Lihat kembali materi, skor, dan tanggal setiap latihan yang berhasil dianalisis."
      />
      <KhususPremium>
        <TabelRiwayat />
      </KhususPremium>
    </div>
  );
}
