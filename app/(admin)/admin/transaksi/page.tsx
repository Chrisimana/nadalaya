import type { Metadata } from "next";
import { LaporanTransaksi } from "@/components/admin/LaporanTransaksi";

export const metadata: Metadata = { title: "Laporan Transaksi" };

export default function HalamanLaporanTransaksi() {
  return <LaporanTransaksi />;
}
