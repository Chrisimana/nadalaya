import { LABEL_PAKET, type StatusPaket } from "@/lib/types";
import { formatTanggal } from "@/lib/waktu";

const SATU_JAM = 60 * 60 * 1000;
const SATU_HARI = 24 * SATU_JAM;
/** Batas selisih jam perangkat dengan jam server agar 7 hari tidak terbaca 8 hari. */
const TOLERANSI_JAM = 5 * 60 * 1000;

type InfoPaket = { statusPaket: StatusPaket; tanggalBerakhir: string | null };

function sisaMs(tanggalBerakhir: string, sekarang: Date) {
  return new Date(tanggalBerakhir).getTime() - sekarang.getTime() - TOLERANSI_JAM;
}

/** Sisa hari dari selisih waktu sebenarnya, dibulatkan ke atas; minimal 0. */
export function sisaHari(tanggalBerakhir: string | null, sekarang: Date = new Date()): number | null {
  if (!tanggalBerakhir) return null;
  const sisa = sisaMs(tanggalBerakhir, sekarang);
  return sisa <= 0 ? 0 : Math.ceil(sisa / SATU_HARI);
}

/** Label sisa masa aktif yang dipakai Langganan, Dashboard, dan Profil. */
export function labelSisa(tanggalBerakhir: string | null, sekarang: Date = new Date()): string | null {
  if (!tanggalBerakhir) return null;
  const sisa = sisaMs(tanggalBerakhir, sekarang);
  if (sisa <= 0) return "Sudah berakhir";
  if (sisa < SATU_JAM) return "Berakhir hari ini";
  if (sisa < SATU_HARI) return `Sisa ${Math.ceil(sisa / SATU_JAM)} jam`;
  return `Sisa ${Math.ceil(sisa / SATU_HARI)} hari`;
}

export type RingkasanPaket = {
  judul: string;
  /** Contoh: "Uji Coba Premium, berakhir 30 Oktober 2026, 14.05 WIB". */
  keterangan: string;
  sisaHari: number | null;
  /** Contoh: "Sisa 7 hari", "Sisa 12 jam"; null bila tanpa masa berlaku. */
  labelSisa: string | null;
};

export function ringkasPaket(info: InfoPaket, sekarang: Date = new Date()): RingkasanPaket {
  const judul = LABEL_PAKET[info.statusPaket];
  if (info.statusPaket === "gratis" || !info.tanggalBerakhir) {
    return { judul, keterangan: "Tanpa masa berlaku", sisaHari: null, labelSisa: null };
  }
  return {
    judul,
    keterangan: `${judul}, berakhir ${formatTanggal(info.tanggalBerakhir, { denganJam: true })}`,
    sisaHari: sisaHari(info.tanggalBerakhir, sekarang),
    labelSisa: labelSisa(info.tanggalBerakhir, sekarang),
  };
}

/** Uji coba hanya untuk pengguna Gratis yang belum pernah memakainya. */
export function bolehUjiCoba(info: { statusPaket: StatusPaket; ujiCobaDigunakan: boolean }) {
  return info.statusPaket === "gratis" && !info.ujiCobaDigunakan;
}
