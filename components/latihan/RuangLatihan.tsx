"use client";

import { ArrowLeft, RotateCw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { KuotaHabis } from "@/components/akses/KuotaHabis";
import { MateriTerkunci } from "@/components/akses/MateriTerkunci";
import { PanelAcuan } from "./PanelAcuan";
import { PanelAnalisis } from "./PanelAnalisis";
import { PanelHasil } from "./hasil/PanelHasil";
import { PerekamSuara } from "./PerekamSuara";
import { bukaLatihan, pesanGalat } from "@/lib/api";
import {
  LABEL_JENIS,
  LABEL_TINGKAT,
  type HasilCekAkses,
  type MateriLengkap,
} from "@/lib/types";
import { useAnalisis } from "@/lib/audio/useAnalisis";
import { usePerekam } from "@/lib/audio/usePerekam";

type KeadaanLatihan =
  | { status: "memuat" }
  | { status: "galat"; pesan: string }
  | { status: "siap"; akses: HasilCekAkses; materi: MateriLengkap };

export function BagianLatihan({
  nomor,
  judul,
  deskripsi,
  children,
}: {
  nomor: number;
  judul: string;
  deskripsi?: string;
  children: ReactNode;
}) {
  return (
    <Card className="flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-nada-700 text-sm font-bold text-white">
          {nomor}
        </span>
        <div>
          <h2 className="font-bold text-tinta">{judul}</h2>
          {deskripsi && <p className="text-sm text-redup">{deskripsi}</p>}
        </div>
      </div>
      {children}
    </Card>
  );
}

/** Halaman latihan: notasi & acuan, perekaman, analisis, dan hasil. */
export function RuangLatihan({ materiId }: { materiId: string }) {
  const [keadaan, setKeadaan] = useState<KeadaanLatihan>({ status: "memuat" });

  const muat = useCallback(() => {
    let aktif = true;
    // UC-08 langkah 1.1: hak akses dan kuota diperiksa server saat materi dipilih,
    // lalu berkas MIDI diunduh lewat signed URL.
    bukaLatihan(materiId)
      .then(({ akses, materi }) => aktif && setKeadaan({ status: "siap", akses, materi }))
      .catch((err) => aktif && setKeadaan({ status: "galat", pesan: pesanGalat(err) }));
    return () => {
      aktif = false;
    };
  }, [materiId]);

  useEffect(() => muat(), [muat]);

  function muatUlang() {
    setKeadaan({ status: "memuat" });
    muat();
  }

  const materi = keadaan.status === "siap" ? keadaan.materi : null;
  const akses = keadaan.status === "siap" ? keadaan.akses : null;
  const ditolak = akses && !akses.diizinkan ? akses : null;
  const sisaKuota = akses?.diizinkan ? akses.sisaKuota : null;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/materi"
        className="inline-flex items-center gap-1.5 self-start rounded-lg text-sm font-semibold text-nada-700 hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Daftar Materi
      </Link>

      <header className="flex flex-col gap-2">
        {materi && (
          <div className="flex flex-wrap gap-2">
            <Badge varian="nada">{LABEL_JENIS[materi.jenis]}</Badge>
            <Badge varian="netral">{LABEL_TINGKAT[materi.tingkat]}</Badge>
            {materi.isPremium && <Badge varian="kuningan">Premium</Badge>}
          </div>
        )}
        <h1 className="font-serif text-3xl font-semibold text-nada-900 sm:text-4xl">
          {keadaan.status === "memuat" ? (
            <span className="inline-block h-9 w-64 animate-pulse rounded-lg bg-nada-100" />
          ) : (
            (materi?.judul ?? "Latihan")
          )}
        </h1>
        {(materi || sisaKuota !== null) && (
          <p className="flex flex-wrap gap-x-4 text-sm text-redup">
            {materi && <span>Tempo {materi.tempo} BPM</span>}
            {sisaKuota !== null && (
              <span>Sisa kuota analisis hari ini: {sisaKuota}</span>
            )}
          </p>
        )}
      </header>

      {keadaan.status === "memuat" && (
        <p
          className="flex items-center gap-2 text-sm text-redup"
          aria-live="polite"
        >
          <span className="size-2 animate-pulse rounded-full bg-nada-400" />
          Memeriksa hak akses dan kuota…
        </p>
      )}

      {keadaan.status === "galat" && (
        <Alert
          varian="galat"
          judul="Latihan belum dapat dibuka"
          aksi={
            <Button
              varian="garis"
              ukuran="sm"
              ikon={<RotateCw className="size-4" aria-hidden="true" />}
              onClick={muatUlang}
            >
              Muat Ulang
            </Button>
          }
        >
          {keadaan.pesan}
        </Alert>
      )}

      {ditolak?.alasan === "materi_premium" && <MateriTerkunci />}
      {ditolak?.alasan === "kuota_habis" && (
        <KuotaHabis waktuReset={ditolak.waktuReset} />
      )}

      {materi && akses?.diizinkan && <IsiLatihan materiId={materiId} materi={materi} />}
    </div>
  );
}

function IsiLatihan({ materiId, materi }: { materiId: string; materi: MateriLengkap }) {
  const perekam = usePerekam();
  const sedangMerekam =
    perekam.status === "merekam" || perekam.status === "meminta_izin";
  const analisis = useAnalisis({
    materiId,
    acuan: materi.nada,
    rekaman: perekam.hasil,
  });
  const sedangMenganalisis = !["siap", "gagal", "selesai"].includes(
    analisis.keadaan.tahap,
  );

  return (
    <>
      <BagianLatihan
        nomor={1}
        judul="Dengarkan acuan"
        deskripsi="Baca notasi sambil memutar acuan nada. Gunakan headphone."
      >
        <PanelAcuan
          nada={materi.nada}
          tempo={materi.tempo}
          nonaktif={sedangMerekam}
        />
      </BagianLatihan>

      <BagianLatihan
        nomor={2}
        judul="Rekam nyanyian"
        deskripsi="Nyanyikan materi tanpa acuan, maksimal 60 detik."
      >
        <PerekamSuara perekam={perekam} terkunci={sedangMenganalisis} />
      </BagianLatihan>

      <BagianLatihan
        nomor={3}
        judul="Analisis dan hasil"
        deskripsi="Sistem menilai akurasi nada dan menampilkan skor."
      >
        <PanelAnalisis
          rekaman={perekam.hasil}
          keadaan={analisis.keadaan}
          onAnalisis={analisis.mulai}
          onCobaLagi={analisis.mulai}
          onRekamUlang={perekam.ulang}
          hasil={
            analisis.keadaan.tahap === "selesai" && (
              <PanelHasil
                hasil={analisis.keadaan.hasil}
                riwayatTersimpan={analisis.keadaan.riwayatTersimpan}
                onLatihLagi={perekam.ulang}
              />
            )
          }
        />
      </BagianLatihan>
    </>
  );
}
