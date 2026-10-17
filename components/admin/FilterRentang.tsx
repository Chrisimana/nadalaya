"use client";

import { Input } from "@/components/ui/Input";
import type { RentangTanggal } from "@/lib/api";

/** Pilihan rentang tanggal (opsional) untuk statistik dan laporan admin. */
export function FilterRentang({
  nilai,
  onUbah,
}: {
  nilai: RentangTanggal;
  onUbah: (nilai: RentangTanggal) => void;
}) {
  const terbalik = !!nilai.dari && !!nilai.sampai && nilai.dari > nilai.sampai;
  return (
    <>
      <Input
        label="Dari tanggal"
        type="date"
        value={nilai.dari ?? ""}
        max={nilai.sampai || undefined}
        onChange={(e) => onUbah({ ...nilai, dari: e.target.value || undefined })}
      />
      <Input
        label="Sampai tanggal"
        type="date"
        value={nilai.sampai ?? ""}
        min={nilai.dari || undefined}
        onChange={(e) => onUbah({ ...nilai, sampai: e.target.value || undefined })}
        galat={terbalik ? "Tanggal akhir tidak boleh sebelum tanggal awal." : undefined}
      />
    </>
  );
}

/** Rentang dianggap sah bila kosong atau tanggal awal tidak melewati akhir. */
export function rentangSah(r: RentangTanggal) {
  return !(r.dari && r.sampai && r.dari > r.sampai);
}
