import { LABEL_PAKET, type StatusPaket } from "@/lib/types";
import { formatTanggal } from "@/lib/waktu";

const SATU_HARI = 24 * 60 * 60 * 1000;

type InfoPaket = { statusPaket: StatusPaket; tanggalBerakhir: string | null };

/** Sisa hari dibulatkan ke atas; 0 bila sudah lewat, null bila tanpa masa berlaku. */
export function sisaHari(tanggalBerakhir: string | null, sekarang: Date = new Date()): number | null {
  if (!tanggalBerakhir) return null;
  const sisa = new Date(tanggalBerakhir).getTime() - sekarang.getTime();
  return sisa <= 0 ? 0 : Math.ceil(sisa / SATU_HARI);
}

export function labelSisaHari(hari: number | null) {
  if (hari === null) return null;
  return hari === 0 ? "Sudah berakhir" : `Sisa ${hari} hari`;
}

export type RingkasanPaket = {
  judul: string;
  /** Contoh: "Uji Coba Premium, berakhir 30 Oktober 2026, 14.05 WIB". */
  keterangan: string;
  sisaHari: number | null;
};

export function ringkasPaket(info: InfoPaket, sekarang: Date = new Date()): RingkasanPaket {
  const judul = LABEL_PAKET[info.statusPaket];
  if (info.statusPaket === "gratis" || !info.tanggalBerakhir) {
    return { judul, keterangan: "Tanpa masa berlaku", sisaHari: null };
  }
  return {
    judul,
    keterangan: `${judul}, berakhir ${formatTanggal(info.tanggalBerakhir, { denganJam: true })}`,
    sisaHari: sisaHari(info.tanggalBerakhir, sekarang),
  };
}

/** Uji coba hanya untuk pengguna Gratis yang belum pernah memakainya. */
export function bolehUjiCoba(info: { statusPaket: StatusPaket; ujiCobaDigunakan: boolean }) {
  return info.statusPaket === "gratis" && !info.ujiCobaDigunakan;
}
