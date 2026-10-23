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
import { bukaLatihan, getStatusPaketDanKuota, pesanGalat } from "@/lib/api";
import {
  LABEL_JENIS,
  LABEL_TINGKAT,
  type HasilCekAkses,
  type MateriLengkap,
} from "@/lib/types";
import { durasiAcuan } from "@/lib/audio/analisis";
import { useAnalisis } from "@/lib/audio/useAnalisis";
import { usePerekam } from "@/lib/audio/usePerekam";

type KeadaanLatihan =
  | { status: "memuat" }
  | { status: "galat"; pesan: string }
  | { status: "siap"; akses: HasilCekAkses; materi: MateriLengkap };

export function BagianLatihan({
  id,
  nomor,
  judul,
  deskripsi,
  children,
}: {
  id?: string;
  nomor: number;
  judul: string;
  deskripsi?: string;
  children: ReactNode;
}) {
  return (
    <Card id={id} className="flex scroll-mt-24 flex-col gap-5">
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

export function RuangLatihan({ materiId }: { materiId: string }) {
  const [keadaan, setKeadaan] = useState<KeadaanLatihan>({ status: "memuat" });
  const [kuotaTerbaru, setKuotaTerbaru] = useState<number | null | undefined>(undefined);

  const segarkanKuota = useCallback(() => {
    getStatusPaketDanKuota()
      .then((p) => setKuotaTerbaru(p.sisaKuota))
      .catch(() => {});
  }, []);

  const muat = useCallback(() => {
    let aktif = true;
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
  const sisaKuota =
    kuotaTerbaru !== undefined ? kuotaTerbaru : akses?.diizinkan ? akses.sisaKuota : null;

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

      {ditolak?.alasan === "materi_premium" && <MateriTerkunci onUjiCobaAktif={muatUlang} />}
      {ditolak?.alasan === "kuota_habis" && (
        <KuotaHabis waktuReset={ditolak.waktuReset} />
      )}

      {materi && akses?.diizinkan && (
        <IsiLatihan materiId={materiId} materi={materi} onSelesai={segarkanKuota} />
      )}
    </div>
  );
}

function IsiLatihan({
  materiId,
  materi,
  onSelesai,
}: {
  materiId: string;
  materi: MateriLengkap;
  onSelesai: () => void;
}) {
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
  const selesai = analisis.keadaan.tahap === "selesai";
  const durasi = durasiAcuan(materi.nada);
  // Rekaman jauh lebih panjang dari materi tetap dianalisis (subsequence DTW).
  const rekamanPanjang = !!perekam.hasil && durasi > 0 && perekam.hasil.durasi > 2 * durasi;

  useEffect(() => {
    if (selesai) onSelesai();
  }, [selesai, onSelesai]);

  function latihLagi() {
    perekam.ulang();
    document.getElementById("langkah-rekam")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

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
        id="langkah-rekam"
        nomor={2}
        judul="Rekam nyanyian"
        deskripsi={`Durasi acuan ±${Math.max(1, Math.round(durasi))} detik. Nyanyikan materi satu kali tanpa acuan, lalu tekan Berhenti.`}
      >
        <PerekamSuara perekam={perekam} terkunci={sedangMenganalisis} />
      </BagianLatihan>

      <BagianLatihan
        nomor={3}
        judul="Analisis dan hasil"
        deskripsi="Sistem menilai akurasi nada dan menampilkan skor."
      >
        {rekamanPanjang && (
          <Alert varian="info" judul="Rekaman lebih panjang dari materi">
            Rekaman Anda lebih dari dua kali durasi acuan. Analisis tetap
            dijalankan, tetapi hanya bagian nyanyian yang cocok dengan materi
            yang dinilai.
          </Alert>
        )}
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
                onLatihLagi={latihLagi}
              />
            )
          }
        />
      </BagianLatihan>
    </>
  );
}
