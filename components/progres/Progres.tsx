"use client";

import { ChartLine } from "lucide-react";
import dynamic from "next/dynamic";
import { KhususPremium } from "@/components/akses/KhususPremium";
import { KepalaAplikasi } from "@/components/pengguna/KepalaAplikasi";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { GagalMuat, Kerangka } from "@/components/ui/Memuat";
import { getProgres } from "@/lib/api";
import { useMuat } from "@/lib/useMuat";

const GrafikProgres = dynamic(
  () => import("./GrafikProgres").then((m) => m.GrafikProgres),
  {
    ssr: false,
    loading: () => <div className="h-72 animate-pulse rounded-xl bg-nada-50 sm:h-80" />,
  },
);

/** Minimal dua latihan agar garis perkembangan bermakna (UC-15). */
const MIN_TITIK = 2;

function Statistik({ label, nilai }: { label: string; nilai: string | number }) {
  return (
    <Card className="flex flex-col gap-1">
      <p className="text-sm font-semibold text-redup">{label}</p>
      <p className="font-serif text-3xl font-semibold text-nada-800 tabular-nums">{nilai}</p>
    </Card>
  );
}

function IsiProgres() {
  const { keadaan, muatUlang } = useMuat(getProgres);

  if (keadaan.status === "memuat") return <Kerangka jumlah={2} tinggi="h-48" />;
  if (keadaan.status === "galat") {
    return <GagalMuat judul="Progres gagal dimuat" pesan={keadaan.pesan} onMuatUlang={muatUlang} />;
  }

  const titik = keadaan.data;
  if (titik.length < MIN_TITIK) {
    return (
      <EmptyState
        ikon={ChartLine}
        judul="Data belum cukup untuk menampilkan grafik"
        deskripsi={`Selesaikan minimal ${MIN_TITIK} latihan untuk melihat perkembangan skor Anda.`}
        aksi={<Button href="/materi">Mulai Latihan</Button>}
      />
    );
  }

  const skor = titik.map((t) => t.skor);
  const rataRata = Math.round(skor.reduce((a, b) => a + b, 0) / skor.length);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Statistik label="Jumlah latihan" nilai={titik.length} />
        <Statistik label="Rata-rata skor" nilai={rataRata} />
        <Statistik label="Skor tertinggi" nilai={Math.round(Math.max(...skor))} />
      </div>
      <Card>
        <h2 className="mb-4 font-bold text-tinta">Perkembangan skor per jenis materi</h2>
        <GrafikProgres titik={titik} />
      </Card>
    </div>
  );
}

/** UC-15 Melihat Grafik Progres (FR-17, khusus Premium). */
export function Progres() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6">
      <KepalaAplikasi
        judul="Grafik progres"
        deskripsi="Pantau perkembangan skor Anda dari waktu ke waktu untuk mengukur kesiapan menghadapi tes."
      />
      <KhususPremium
        judul="Grafik progres khusus Premium"
        deskripsi="Grafik perkembangan skor dan riwayat latihan tersedia di paket Premium atau Uji Coba Premium 7 hari. Skor dan grafik nada tetap tampil setiap kali Anda selesai berlatih."
      >
        <IsiProgres />
      </KhususPremium>
    </div>
  );
}

