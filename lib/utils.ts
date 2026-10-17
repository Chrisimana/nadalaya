/** Menggabungkan nama kelas CSS dan mengabaikan nilai kosong. */
export function cn(...kelas: Array<string | false | null | undefined>) {
  return kelas.filter(Boolean).join(" ");
}
