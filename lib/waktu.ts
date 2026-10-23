const SATU_JAM = 60 * 60 * 1000;
const SATU_HARI = 24 * SATU_JAM;
const SELISIH_WIB = 7 * SATU_JAM;

export function resetKuotaBerikutnya(sekarang: Date = new Date()) {
  const wib = sekarang.getTime() + SELISIH_WIB;
  const tengahMalamWib = Math.floor(wib / SATU_HARI) * SATU_HARI + SATU_HARI;
  return new Date(tengahMalamWib - SELISIH_WIB);
}

export function formatSisaWaktu(ms: number) {
  if (ms <= 0) return "sebentar lagi";
  const totalMenit = Math.floor(ms / 60_000);
  const jam = Math.floor(totalMenit / 60);
  const menit = totalMenit % 60;
  if (jam === 0 && menit === 0) return "kurang dari 1 menit";
  return [jam > 0 && `${jam} jam`, menit > 0 && `${menit} menit`]
    .filter(Boolean)
    .join(" ");
}

export function formatWaktuWib(waktu: Date) {
  const tanggal = waktu.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
  const jam = waktu
    .toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Jakarta",
    })
    .replace(":", ".");
  return `${tanggal} pukul ${jam} WIB`;
}

export function formatDurasi(detik: number) {
  const total = Math.max(0, Math.floor(detik));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export function formatTanggal(iso: string, opsi?: { denganJam?: boolean; ringkas?: boolean }) {
  const waktu = new Date(iso);
  const tanggal = waktu.toLocaleDateString("id-ID", {
    day: "numeric",
    month: opsi?.ringkas ? "short" : "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
  if (!opsi?.denganJam) return tanggal;
  const jam = waktu
    .toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Jakarta",
    })
    .replace(":", ".");
  return `${tanggal}, ${jam} WIB`;
}
