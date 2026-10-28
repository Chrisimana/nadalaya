"use client";

import { ReceiptText } from "lucide-react";
import { useCallback, useState } from "react";
import { KepalaAplikasi } from "@/components/pengguna/KepalaAplikasi";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { GagalMuat, Kerangka } from "@/components/ui/Memuat";
import { Pilihan } from "@/components/ui/Pilihan";
import { getTransaksiAdminList, type RentangTanggal } from "@/lib/api";
import { DAFTAR_PAKET, formatRupiah } from "@/lib/paket";
import { LABEL_STATUS_TRANSAKSI, type StatusTransaksi } from "@/lib/types";
import { useMuat } from "@/lib/useMuat";
import { formatTanggal } from "@/lib/waktu";
import { FilterRentang, rentangSah } from "./FilterRentang";

const OPSI_STATUS = [
  { nilai: "semua", label: "Semua status" },
  ...(Object.keys(LABEL_STATUS_TRANSAKSI) as StatusTransaksi[]).map((s) => ({
    nilai: s,
    label: LABEL_STATUS_TRANSAKSI[s],
  })),
];

const VARIAN_STATUS = {
  berhasil: "sukses",
  tertunda: "kuningan",
  gagal: "galat",
  kedaluwarsa: "netral",
} as const;

function namaPaket(kode: string) {
  return DAFTAR_PAKET.find((p) => p.kode === kode)?.nama ?? kode;
}

export function LaporanTransaksi() {
  const [rentang, setRentang] = useState<RentangTanggal>({});
  const [status, setStatus] = useState("semua");
  const sah = rentangSah(rentang);
  const ambil = useCallback(
    () =>
      getTransaksiAdminList({
        ...(sah ? rentang : {}),
        status: status === "semua" ? undefined : (status as StatusTransaksi),
      }),
    [rentang, sah, status],
  );
  const { keadaan, muatUlang } = useMuat(ambil);

  const pendapatan =
    keadaan.status === "siap"
      ? keadaan.data.filter((t) => t.status === "berhasil").reduce((s, t) => s + t.nominal, 0)
      : 0;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6">
      <KepalaAplikasi
        judul="Laporan Transaksi"
        deskripsi="Daftar pembayaran paket beserta nominal, metode, dan statusnya."
      />

      <div className="grid gap-3 sm:grid-cols-3 lg:max-w-3xl">
        <FilterRentang nilai={rentang} onUbah={setRentang} />
        <Pilihan label="Status" opsi={OPSI_STATUS} value={status} onChange={(e) => setStatus(e.target.value)} />
      </div>

      {keadaan.status === "memuat" && <Kerangka jumlah={5} tinggi="h-14" />}
      {keadaan.status === "galat" && (
        <GagalMuat judul="Transaksi gagal dimuat" pesan={keadaan.pesan} onMuatUlang={muatUlang} />
      )}
      {keadaan.status === "siap" && keadaan.data.length === 0 && (
        <EmptyState
          ikon={ReceiptText}
          judul="Belum ada transaksi"
          deskripsi="Transaksi pembelian paket akan tampil di sini sesuai filter yang dipilih."
        />
      )}

      {keadaan.status === "siap" && keadaan.data.length > 0 && (
        <>
          <Card className="flex flex-col gap-1 sm:max-w-xs">
            <p className="text-sm font-semibold text-redup">Total pendapatan (transaksi berhasil)</p>
            <p className="font-serif text-3xl font-semibold text-nada-900 tabular-nums">
              {formatRupiah(pendapatan)}
            </p>
          </Card>
          <div className="relative overflow-x-auto rounded-2xl border border-garis bg-white">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="border-b border-garis bg-nada-50/60 text-left text-xs tracking-wide text-redup uppercase">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">ID pesanan</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Pengguna</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Paket</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Nominal</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Metode</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-garis">
                {keadaan.data.map((t) => (
                  <tr key={t.orderId}>
                    <td className="px-5 py-3 font-mono text-xs text-tinta">{t.orderId}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-tinta">{t.namaPengguna}</p>
                      <p className="text-redup">{t.emailPengguna}</p>
                    </td>
                    <td className="px-4 py-3">{namaPaket(t.paket)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatRupiah(t.nominal)}</td>
                    <td className="px-4 py-3">{t.metode ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge varian={VARIAN_STATUS[t.status]}>{LABEL_STATUS_TRANSAKSI[t.status]}</Badge>
                    </td>
                    <td className="px-5 py-3 text-redup">
                      {formatTanggal(t.dibuat, { denganJam: true, ringkas: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
