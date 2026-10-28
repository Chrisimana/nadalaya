"use client";

import {
  ArrowUpDown,
  Library,
  ListMusic,
  Music4,
  RotateCw,
  SearchX,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { getMateriList, pesanGalat } from "@/lib/api";
import {
  LABEL_JENIS,
  LABEL_TINGKAT,
  URUTAN_JENIS,
  URUTAN_TINGKAT,
  type JenisMateri,
  type Materi,
  type TingkatMateri,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { KartuMateri } from "./KartuMateri";

const infoJenis: Record<JenisMateri, { ikon: LucideIcon; deskripsi: string }> =
  {
    tangga_nada: {
      ikon: ArrowUpDown,
      deskripsi: "Nyanyikan urutan nada naik dan turun dalam satu tangga nada.",
    },
    interval: {
      ikon: Music4,
      deskripsi: "Latih jarak antara dua nada, dari sekunde hingga oktaf.",
    },
    melodi: {
      ikon: ListMusic,
      deskripsi: "Baca dan nyanyikan melodi pendek seperti pada tes solfeggio.",
    },
  };

type Keadaan =
  | { status: "memuat" }
  | { status: "galat"; pesan: string }
  | { status: "siap"; materi: Materi[] };

type Saring<T> = T | "semua";

function Chip({
  aktif,
  onClick,
  children,
}: {
  aktif: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={aktif}
      className={cn(
        "h-9 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors",
        aktif
          ? "border-nada-700 bg-nada-700 text-white"
          : "border-garis bg-white text-redup hover:border-nada-300 hover:text-nada-800",
      )}
    >
      {children}
    </button>
  );
}

export function DaftarMateri() {
  const [keadaan, setKeadaan] = useState<Keadaan>({ status: "memuat" });
  const [jenis, setJenis] = useState<Saring<JenisMateri>>("semua");
  const [tingkat, setTingkat] = useState<Saring<TingkatMateri>>("semua");

  const muat = useCallback(() => {
    let aktif = true;
    getMateriList()
      .then((materi) => aktif && setKeadaan({ status: "siap", materi }))
      .catch(
        (err) =>
          aktif && setKeadaan({ status: "galat", pesan: pesanGalat(err) }),
      );
    return () => {
      aktif = false;
    };
  }, []);

  useEffect(() => muat(), [muat]);

  const kelompok = useMemo(() => {
    if (keadaan.status !== "siap") return [];
    const tersaring = keadaan.materi.filter(
      (m) =>
        (jenis === "semua" || m.jenis === jenis) &&
        (tingkat === "semua" || m.tingkat === tingkat),
    );
    return URUTAN_JENIS.map((j) => ({
      jenis: j,
      perTingkat: URUTAN_TINGKAT.map((t) => ({
        tingkat: t,
        materi: tersaring.filter((m) => m.jenis === j && m.tingkat === t),
      })).filter((g) => g.materi.length > 0),
    })).filter((g) => g.perTingkat.length > 0);
  }, [keadaan, jenis, tingkat]);

  const adaMateri = keadaan.status === "siap" && keadaan.materi.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header>
        <p className="text-sm font-semibold text-kuningan-600">Materi Latihan</p>
        <h1 className="mt-1 font-serif text-3xl font-semibold text-nada-900 sm:text-4xl">
          Pilih materi yang ingin dilatih
        </h1>
        <p className="mt-2 max-w-2xl text-redup">
          Materi dikelompokkan per jenis dan tingkat. Materi bertanda gembok
          khusus untuk pengguna Premium.
        </p>
      </header>

      {adaMateri && (
        <div className="flex flex-col gap-3">
          <div
            className="relative -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
            role="group"
            aria-label="Saring berdasarkan jenis"
          >
            <Chip aktif={jenis === "semua"} onClick={() => setJenis("semua")}>
              Semua jenis
            </Chip>
            {URUTAN_JENIS.map((j) => (
              <Chip key={j} aktif={jenis === j} onClick={() => setJenis(j)}>
                {LABEL_JENIS[j]}
              </Chip>
            ))}
          </div>
          <div
            className="relative -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
            role="group"
            aria-label="Saring berdasarkan tingkat"
          >
            <Chip
              aktif={tingkat === "semua"}
              onClick={() => setTingkat("semua")}
            >
              Semua tingkat
            </Chip>
            {URUTAN_TINGKAT.map((t) => (
              <Chip key={t} aktif={tingkat === t} onClick={() => setTingkat(t)}>
                {LABEL_TINGKAT[t]}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {keadaan.status === "memuat" && (
        <div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          aria-busy="true"
          aria-label="Memuat materi"
        >
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-2xl border border-garis bg-white"
            />
          ))}
        </div>
      )}

      {keadaan.status === "galat" && (
        <Alert
          varian="galat"
          judul="Materi gagal dimuat"
          aksi={
            <Button
              varian="garis"
              ukuran="sm"
              ikon={<RotateCw className="size-4" aria-hidden="true" />}
              onClick={() => {
                setKeadaan({ status: "memuat" });
                muat();
              }}
            >
              Muat Ulang
            </Button>
          }
        >
          {keadaan.pesan}
        </Alert>
      )}

      {keadaan.status === "siap" && !adaMateri && (
        <EmptyState
          ikon={Library}
          judul="Belum ada materi"
          deskripsi="Materi tangga nada, interval, dan melodi akan tampil di sini setelah ditambahkan oleh admin."
          aksi={
            <Button href="/dashboard" varian="garis">
              Kembali ke Dashboard
            </Button>
          }
        />
      )}

      {adaMateri && kelompok.length === 0 && (
        <EmptyState
          ikon={SearchX}
          judul="Materi tidak ditemukan"
          deskripsi="Tidak ada materi yang cocok dengan pilihan jenis dan tingkat ini."
          aksi={
            <Button
              varian="garis"
              onClick={() => {
                setJenis("semua");
                setTingkat("semua");
              }}
            >
              Tampilkan Semua Materi
            </Button>
          }
        />
      )}

      {kelompok.map(({ jenis: j, perTingkat }) => {
        const { ikon: Ikon, deskripsi } = infoJenis[j];
        return (
          <section key={j} aria-labelledby={`jenis-${j}`} className="flex flex-col gap-5">
            <div className="flex items-start gap-3 border-b border-garis pb-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-nada-700 text-white">
                <Ikon className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2
                  id={`jenis-${j}`}
                  className="font-serif text-2xl font-semibold text-nada-900"
                >
                  {LABEL_JENIS[j]}
                </h2>
                <p className="text-sm text-redup">{deskripsi}</p>
              </div>
            </div>
            {perTingkat.map(({ tingkat: t, materi }) => (
              <div key={t} className="flex flex-col gap-3">
                <h3 className="text-sm font-bold tracking-wide text-redup uppercase">
                  Tingkat {LABEL_TINGKAT[t]}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {materi.map((m) => (
                    <KartuMateri key={m.id} materi={m} />
                  ))}
                </div>
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}
