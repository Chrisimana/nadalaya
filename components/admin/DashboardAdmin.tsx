"use client";

import {
  BarChart3,
  ChevronRight,
  CircleCheck,
  ListMusic,
  Mic,
  ReceiptText,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { KepalaAplikasi } from "@/components/pengguna/KepalaAplikasi";
import { GagalMuat, Kerangka } from "@/components/ui/Memuat";
import { getRingkasanAdmin } from "@/lib/api";
import { formatRupiah } from "@/lib/paket";
import { useMuat } from "@/lib/useMuat";
import { KartuStat } from "./KartuStat";

const pintasan: { href: string; judul: string; isi: string; ikon: LucideIcon }[] = [
  { href: "/admin/materi", judul: "Kelola Materi", isi: "Tambah, ubah, dan hapus materi beserta berkas MIDI.", ikon: ListMusic },
  { href: "/admin/pengguna", judul: "Kelola Pengguna", isi: "Lihat status langganan dan nonaktifkan akun.", ikon: Users },
  { href: "/admin/statistik", judul: "Statistik Latihan", isi: "Jumlah sesi, rata-rata skor, dan materi terpopuler.", ikon: BarChart3 },
  { href: "/admin/transaksi", judul: "Laporan Transaksi", isi: "Daftar pembayaran dengan filter tanggal dan status.", ikon: ReceiptText },
];

export function DashboardAdmin() {
  const { keadaan, muatUlang } = useMuat(getRingkasanAdmin);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6">
      <KepalaAplikasi
        judul="Dashboard Admin"
        deskripsi="Ringkasan jumlah pengguna, latihan, dan transaksi Nadalaya."
      />

      {keadaan.status === "memuat" && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <Kerangka jumlah={1} tinggi="h-32" />
          <Kerangka jumlah={1} tinggi="h-32" />
          <Kerangka jumlah={1} tinggi="h-32" />
          <Kerangka jumlah={1} tinggi="h-32" />
        </div>
      )}
      {keadaan.status === "galat" && (
        <GagalMuat judul="Ringkasan gagal dimuat" pesan={keadaan.pesan} onMuatUlang={muatUlang} />
      )}
      {keadaan.status === "siap" && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <KartuStat ikon={Users} label="Jumlah pengguna" nilai={keadaan.data.jumlahPengguna} />
          <KartuStat ikon={Mic} label="Jumlah latihan" nilai={keadaan.data.jumlahLatihan} />
          <KartuStat ikon={CircleCheck} label="Transaksi berhasil" nilai={keadaan.data.transaksiBerhasil} />
          <KartuStat ikon={Wallet} label="Pendapatan" nilai={formatRupiah(keadaan.data.pendapatan)} />
        </div>
      )}

      <section aria-labelledby="judul-pintasan" className="flex flex-col gap-4">
        <h2 id="judul-pintasan" className="font-bold text-tinta">Kelola</h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {pintasan.map(({ href, judul, isi, ikon: Ikon }) => (
            <li key={href}>
              <Link
                href={href}
                className="group flex items-center gap-4 rounded-2xl border border-garis bg-white p-5 transition-colors hover:border-nada-300"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-kuningan-100 text-kuningan-700">
                  <Ikon className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-tinta">{judul}</p>
                  <p className="text-sm text-redup">{isi}</p>
                </div>
                <ChevronRight className="size-5 text-redup group-hover:text-nada-700" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
