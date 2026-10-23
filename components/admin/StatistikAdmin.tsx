"use client";

import { BarChart3, Music, Target, UserCheck, Activity } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { KepalaAplikasi } from "@/components/pengguna/KepalaAplikasi";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { GagalMuat, Kerangka } from "@/components/ui/Memuat";
import { getStatistikLatihan, type RentangTanggal } from "@/lib/api";
import { useMuat } from "@/lib/useMuat";
import { FilterRentang, rentangSah } from "./FilterRentang";
import { KartuStat } from "./KartuStat";

const GrafikLatihanHarian = dynamic(
  () => import("./GrafikLatihanHarian").then((m) => m.GrafikLatihanHarian),
  { ssr: false, loading: () => <div className="h-72 animate-pulse rounded-xl bg-nada-50" /> },
);

/** UC-26 Melihat Statistik Latihan (FR-22). */
export function StatistikAdmin() {
  const [rentang, setRentang] = useState<RentangTanggal>({});
  const sah = rentangSah(rentang);
  const ambil = useCallback(
    () => getStatistikLatihan(sah ? rentang : {}),
    [rentang, sah],
  );
  const { keadaan, muatUlang } = useMuat(ambil);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6">
      <KepalaAplikasi
        judul="Statistik Latihan"
        deskripsi="Pantau aktivitas latihan dan materi yang paling diminati."
      />

      <div className="flex flex-col gap-2">
        <div className="grid gap-3 sm:grid-cols-2 lg:max-w-xl">
          <FilterRentang nilai={rentang} onUbah={setRentang} />
        </div>
        <p className="text-sm text-redup">
          {rentang.dari || rentang.sampai
            ? "Tanggal mengikuti zona waktu WIB."
            : "Tanpa pilihan tanggal, statistik menampilkan 30 hari terakhir (WIB)."}
        </p>
      </div>

      {keadaan.status === "memuat" && <Kerangka jumlah={2} tinggi="h-40" />}
      {keadaan.status === "galat" && (
        <GagalMuat judul="Statistik gagal dimuat" pesan={keadaan.pesan} onMuatUlang={muatUlang} />
      )}
      {keadaan.status === "siap" && (
        <>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <KartuStat ikon={Activity} label="Jumlah sesi latihan" nilai={keadaan.data.jumlahSesi} />
            <KartuStat
              ikon={Target}
              label="Rata-rata skor"
              nilai={keadaan.data.rataRataSkor === null ? "—" : Math.round(keadaan.data.rataRataSkor)}
            />
            <KartuStat
              ikon={Music}
              label="Materi terpopuler"
              nilai={keadaan.data.materiTerpopuler?.judul ?? "—"}
              keterangan={
                keadaan.data.materiTerpopuler
                  ? `${keadaan.data.materiTerpopuler.jumlah} kali dilatih`
                  : undefined
              }
            />
            <KartuStat ikon={UserCheck} label="Pengguna aktif" nilai={keadaan.data.penggunaAktif} />
          </div>

          <Card>
            <h2 className="mb-4 font-bold text-tinta">Jumlah latihan per hari</h2>
            {keadaan.data.perHari.length === 0 ? (
              <EmptyState
                ringkas
                ikon={BarChart3}
                judul="Belum ada data latihan"
                deskripsi="Grafik tampil setelah pengguna menyelesaikan latihan pada rentang tanggal ini."
              />
            ) : (
              <GrafikLatihanHarian perHari={keadaan.data.perHari} />
            )}
          </Card>
        </>
      )}
    </div>
  );
}
