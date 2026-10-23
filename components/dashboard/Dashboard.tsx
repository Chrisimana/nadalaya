"use client";

import {
  CalendarClock,
  Crown,
  Gauge,
  Headphones,
  History,
  Infinity as IkonTanpaBatas,
  ListMusic,
  Lock,
  Mic,
  Music,
  RotateCw,
  Trophy,
  Volume2,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { getRingkasanDashboard, pesanGalat } from "@/lib/api";
import { KUOTA_HARIAN_GRATIS } from "@/lib/paket";
import { ringkasPaket } from "@/lib/statusPaket";
import {
  LABEL_JENIS,
  LABEL_PAKET,
  LABEL_TINGKAT,
  type RingkasanDashboard,
  type StatusPaket,
} from "@/lib/types";

const kiatLatihan: { ikon: LucideIcon; teks: string }[] = [
  { ikon: Headphones, teks: "Pakai headphone agar suara acuan tidak ikut terekam." },
  { ikon: Volume2, teks: "Berlatih di ruangan yang tenang untuk hasil yang lebih akurat." },
  { ikon: Mic, teks: "Izinkan akses mikrofon saat browser meminta." },
];

type Keadaan =
  | { status: "memuat" }
  | { status: "galat"; pesan: string }
  | { status: "siap"; data: RingkasanDashboard; paket: StatusPaket };

function formatTanggal(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

function KartuRingkas({
  ikon: Ikon,
  judul,
  children,
}: {
  ikon: LucideIcon;
  judul: string;
  children: ReactNode;
}) {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-lg bg-nada-50 text-nada-600">
          <Ikon className="size-5" aria-hidden="true" />
        </span>
        <h2 className="text-sm font-bold text-tinta">{judul}</h2>
      </div>
      <div className="flex flex-1 flex-col">{children}</div>
    </Card>
  );
}

function KerangkaMemuat() {
  return (
    <div
      className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4"
      aria-busy="true"
      aria-label="Memuat ringkasan"
    >
      {Array.from({ length: 4 }, (_, i) => (
        <div
          key={i}
          className="h-48 animate-pulse rounded-2xl border border-garis bg-white"
        />
      ))}
    </div>
  );
}

function TautanRiwayat({ terkunci }: { terkunci: boolean }) {
  return (
    <Link
      href="/riwayat"
      className="mt-auto inline-flex items-center gap-1.5 self-start pt-4 text-sm font-semibold text-nada-700 underline-offset-4 hover:underline"
    >
      <History className="size-4" aria-hidden="true" />
      Lihat riwayat
      {terkunci && (
        <>
          <Lock className="size-3.5 text-kuningan-600" aria-hidden="true" />
          <span className="sr-only">(khusus Premium)</span>
        </>
      )}
    </Link>
  );
}

function IsiRingkasan({
  data,
  paket,
}: {
  data: RingkasanDashboard;
  paket: StatusPaket;
}) {
  const { pengguna, sisaKuota, materiTerakhir, skorTerbaru } = data;
  const statusPaket = pengguna ? ringkasPaket(pengguna) : null;

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      <KartuRingkas ikon={Crown} judul="Status paket">
        {pengguna ? (
          <div className="flex flex-col gap-2">
            <Badge varian="nada" className="self-start">
              {LABEL_PAKET[pengguna.statusPaket]}
            </Badge>
            <p className="text-sm text-redup">{statusPaket?.keterangan}</p>
            {statusPaket?.labelSisa && (
              <p className="text-sm font-semibold text-nada-700">{statusPaket.labelSisa}</p>
            )}
          </div>
        ) : (
          <EmptyState
            ringkas
            ikon={Crown}
            judul="Belum ada data paket"
            deskripsi="Status paket belum dapat dimuat."
            className="flex-1"
          />
        )}
      </KartuRingkas>

      <KartuRingkas ikon={Gauge} judul="Sisa kuota hari ini">
        {pengguna ? (
          <div className="flex flex-col gap-1">
            <p className="font-serif text-4xl font-semibold text-nada-800">
              {sisaKuota === null ? (
                <>
                  <IkonTanpaBatas className="inline size-10 align-middle" aria-hidden="true" />
                  <span className="sr-only">Tanpa batas</span>
                </>
              ) : (
                sisaKuota
              )}
              {sisaKuota !== null && (
                <span className="text-lg text-redup">
                  {" "}
                  / {KUOTA_HARIAN_GRATIS}
                </span>
              )}
            </p>
            <p className="text-sm text-redup">
              {sisaKuota === null
                ? "Analisis tanpa batas."
                : "Kuota diperbarui pukul 00.00 WIB."}
            </p>
          </div>
        ) : (
          <EmptyState
            ringkas
            ikon={Gauge}
            judul="Belum ada data kuota"
            deskripsi="Paket Gratis mendapat 3 analisis per hari."
            className="flex-1"
          />
        )}
      </KartuRingkas>

      <KartuRingkas ikon={Music} judul="Materi terakhir">
        {materiTerakhir ? (
          <div className="flex flex-1 flex-col gap-3">
            <div>
              <p className="font-semibold text-tinta">{materiTerakhir.judul}</p>
              <p className="text-sm text-redup">
                {LABEL_JENIS[materiTerakhir.jenis]} ·{" "}
                {LABEL_TINGKAT[materiTerakhir.tingkat]}
              </p>
            </div>
            <Button
              href={`/latihan/${materiTerakhir.id}`}
              varian="garis"
              ukuran="sm"
              className="mt-auto self-start"
            >
              Lanjutkan
            </Button>
          </div>
        ) : (
          <EmptyState
            ringkas
            ikon={Music}
            judul="Belum ada latihan"
            deskripsi="Materi yang terakhir Anda latih akan muncul di sini."
            className="flex-1"
          />
        )}
      </KartuRingkas>

      <KartuRingkas ikon={Trophy} judul="Skor terbaru">
        {skorTerbaru ? (
          <div className="flex flex-col gap-1">
            <p className="font-serif text-4xl font-semibold text-nada-800">
              {skorTerbaru.skor}
              <span className="text-lg text-redup"> / 100</span>
            </p>
            <p className="text-sm text-redup">
              {skorTerbaru.judulMateri} · {formatTanggal(skorTerbaru.tanggal)}
            </p>
          </div>
        ) : (
          <EmptyState
            ringkas
            ikon={Trophy}
            judul="Belum ada skor"
            deskripsi="Selesaikan satu latihan untuk melihat skor pertama Anda."
            className="flex-1"
          />
        )}
        <TautanRiwayat terkunci={paket === "gratis"} />
      </KartuRingkas>
    </div>
  );
}

export function Dashboard() {
  const [keadaan, setKeadaan] = useState<Keadaan>({ status: "memuat" });

  const muat = useCallback(() => {
    let aktif = true;
    getRingkasanDashboard()
      .then(
        (data) =>
          aktif &&
          setKeadaan({
            status: "siap",
            data,
            paket: data.pengguna?.statusPaket ?? "gratis",
          }),
      )
      .catch(
        (err) =>
          aktif && setKeadaan({ status: "galat", pesan: pesanGalat(err) }),
      );
    return () => {
      aktif = false;
    };
  }, []);

  useEffect(() => muat(), [muat]);

  const nama =
    keadaan.status === "siap" ? keadaan.data.pengguna?.nama : undefined;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-kuningan-600">Dashboard</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-nada-900 sm:text-4xl">
            {nama ? `Halo, ${nama.split(" ")[0]}!` : "Selamat berlatih!"}
          </h1>
          <p className="mt-2 text-redup">
            Pantau paket, kuota, dan hasil latihan Anda di sini.
          </p>
        </div>
        <Button
          href="/materi"
          ukuran="lg"
          ikon={<ListMusic className="size-5" aria-hidden="true" />}
        >
          Mulai Latihan
        </Button>
      </header>

      {keadaan.status === "memuat" && <KerangkaMemuat />}
      {keadaan.status === "galat" && (
        <Alert
          varian="galat"
          judul="Ringkasan gagal dimuat"
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
      {keadaan.status === "siap" && keadaan.data.ujiCobaBerakhir && (
        <Alert
          varian="info"
          judul="Uji coba Premium Anda telah berakhir"
          aksi={
            <Button href="/langganan" varian="garis" ukuran="sm">
              Lihat Paket
            </Button>
          }
        >
          Akun Anda kembali ke paket Gratis. Berlangganan Premium untuk membuka
          lagi seluruh materi, riwayat, dan grafik progres.
        </Alert>
      )}
      {keadaan.status === "siap" && <IsiRingkasan data={keadaan.data} paket={keadaan.paket} />}

      <Card className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-kuningan-100 text-kuningan-700">
            <CalendarClock className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-bold text-tinta">Sebelum mulai latihan</h2>
            <p className="text-sm text-redup">
              Tiga hal kecil agar skor Anda lebih akurat.
            </p>
          </div>
        </div>
        <ul className="grid gap-3 sm:grid-cols-3 lg:max-w-3xl">
          {kiatLatihan.map(({ ikon: Ikon, teks }) => (
            <li
              key={teks}
              className="flex items-start gap-2.5 rounded-xl bg-nada-50/60 p-3 text-sm text-tinta"
            >
              <Ikon
                className="mt-0.5 size-4 shrink-0 text-nada-600"
                aria-hidden="true"
              />
              {teks}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
