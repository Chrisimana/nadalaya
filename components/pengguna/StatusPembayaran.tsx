"use client";

import {
  CircleCheck,
  CircleX,
  Clock4,
  ReceiptText,
  TimerOff,
  type LucideIcon,
} from "lucide-react";
import { useCallback } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { GagalMuat, Memuat } from "@/components/ui/Memuat";
import { getTransaksi } from "@/lib/api";
import { DAFTAR_PAKET, formatRupiah } from "@/lib/paket";
import type { StatusTransaksi, Transaksi } from "@/lib/types";
import { useMuat } from "@/lib/useMuat";
import { cn } from "@/lib/utils";
import { formatTanggal } from "@/lib/waktu";

const TAMPILAN: Record<
  StatusTransaksi,
  { ikon: LucideIcon; judul: string; isi: string; warna: string }
> = {
  berhasil: {
    ikon: CircleCheck,
    judul: "Pembayaran berhasil",
    isi: "Terima kasih. Paket Anda sudah aktif dan dapat langsung digunakan.",
    warna: "bg-emerald-50 text-emerald-600",
  },
  tertunda: {
    ikon: Clock4,
    judul: "Menunggu pembayaran",
    isi: "Selesaikan pembayaran melalui Virtual Account atau QRIS sebelum batas waktu. Paket aktif otomatis setelah pembayaran terkonfirmasi.",
    warna: "bg-kuningan-50 text-kuningan-600",
  },
  gagal: {
    ikon: CircleX,
    judul: "Pembayaran gagal",
    isi: "Pembayaran ditolak atau dibatalkan. Silakan coba lagi dari halaman Langganan.",
    warna: "bg-red-50 text-red-600",
  },
  kedaluwarsa: {
    ikon: TimerOff,
    judul: "Batas waktu pembayaran habis",
    isi: "Pesanan ini sudah kedaluwarsa. Buat pesanan baru dari halaman Langganan.",
    warna: "bg-red-50 text-red-600",
  },
};

function Baris({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 sm:flex-row sm:justify-between sm:gap-6">
      <dt className="text-sm text-redup">{label}</dt>
      <dd className="text-sm font-semibold break-all text-tinta sm:text-right">{children}</dd>
    </div>
  );
}

function RingkasanTransaksi({ orderId, transaksi }: { orderId: string; transaksi: Transaksi | null }) {
  const paket = transaksi && DAFTAR_PAKET.find((p) => p.kode === transaksi.paket);
  return (
    <Card className="flex flex-col gap-2">
      <h2 className="flex items-center gap-2 font-bold text-tinta">
        <ReceiptText className="size-5 text-nada-600" aria-hidden="true" />
        Ringkasan transaksi
      </h2>
      <dl className="divide-y divide-garis">
        <Baris label="ID pesanan">{orderId}</Baris>
        {transaksi && (
          <>
            <Baris label="Paket">{paket?.nama ?? transaksi.paket}</Baris>
            <Baris label="Nominal">{formatRupiah(transaksi.nominal)}</Baris>
            <Baris label="Metode pembayaran">{transaksi.metode ?? "Belum dipilih"}</Baris>
            <Baris label="Tanggal pesanan">
              {formatTanggal(transaksi.dibuat, { denganJam: true })}
            </Baris>
            {transaksi.dibayar && (
              <Baris label="Tanggal dibayar">
                {formatTanggal(transaksi.dibayar, { denganJam: true })}
              </Baris>
            )}
          </>
        )}
      </dl>
      {!transaksi && (
        <p className="text-sm text-redup">
          Rincian transaksi lainnya belum tersedia karena belum tersambung ke server.
        </p>
      )}
    </Card>
  );
}

/** Halaman status pembayaran (UC-18) setelah kembali dari Midtrans. */
export function StatusPembayaran({
  orderId,
  statusDariUrl,
}: {
  orderId: string | null;
  statusDariUrl: StatusTransaksi | null;
}) {
  const ambil = useCallback(
    () => (orderId ? getTransaksi(orderId) : Promise.resolve(null)),
    [orderId],
  );
  const { keadaan, muatUlang } = useMuat(ambil);

  if (!orderId && !statusDariUrl) {
    return (
      <EmptyState
        ikon={ReceiptText}
        judul="Tidak ada transaksi untuk ditampilkan"
        deskripsi="Halaman ini menampilkan status pembayaran setelah Anda membeli paket."
        aksi={<Button href="/langganan">Ke Halaman Langganan</Button>}
      />
    );
  }

  if (keadaan.status === "memuat") return <Memuat teks="Memeriksa status pembayaran…" />;
  if (keadaan.status === "galat") {
    return (
      <GagalMuat judul="Status pembayaran gagal dimuat" pesan={keadaan.pesan} onMuatUlang={muatUlang} />
    );
  }

  // Status dari server lebih diutamakan daripada parameter alamat.
  const status = keadaan.data?.status ?? statusDariUrl;
  const tampilan = status ? TAMPILAN[status] : null;
  const gagal = status === "gagal" || status === "kedaluwarsa";

  return (
    <div className="flex flex-col gap-6">
      {tampilan ? (
        <div className="flex flex-col items-center gap-3 text-center">
          <span className={cn("flex size-16 items-center justify-center rounded-full", tampilan.warna)}>
            <tampilan.ikon className="size-8" aria-hidden="true" />
          </span>
          <h1 className="font-serif text-3xl font-semibold text-nada-900">{tampilan.judul}</h1>
          <p className="max-w-md text-redup">{tampilan.isi}</p>
        </div>
      ) : (
        <Alert varian="info" judul="Status pembayaran belum dapat dipastikan">
          Status akan diperbarui otomatis setelah konfirmasi dari Midtrans diterima.
        </Alert>
      )}

      {orderId && <RingkasanTransaksi orderId={orderId} transaksi={keadaan.data} />}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button href="/langganan" varian={gagal ? "utama" : "garis"}>
          {gagal ? "Coba Lagi" : "Kembali ke Langganan"}
        </Button>
        <Button href="/dashboard" varian={gagal ? "garis" : "utama"}>
          Ke Dashboard
        </Button>
      </div>
    </div>
  );
}
