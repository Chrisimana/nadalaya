import "server-only";

import { klienAdmin } from "@/lib/supabase/admin";
import type { PenggunaAdmin, StatusPaket } from "@/lib/types";
import type { BarisUsers } from "./pengguna";

export const KOLOM_PENGGUNA_ADMIN =
  "id, nama, email, peran, status_paket, tanggal_berakhir, uji_coba_digunakan, tanggal_mulai_uji_coba, is_aktif, created_at, riwayat_latihan(count)";

export type BarisPenggunaAdmin = BarisUsers & { riwayat_latihan: { count: number }[] };

/**
 * Status paket efektif memakai fungsi basis data status_paket_efektif().
 * Paket gratis selalu gratis, jadi hanya akun uji coba/premium yang diperiksa.
 */
async function paketEfektif(baris: BarisUsers[]): Promise<Map<string, StatusPaket>> {
  const hasil = new Map<string, StatusPaket>();
  await Promise.all(
    baris
      .filter((b) => b.status_paket !== "gratis")
      .map(async (b) => {
        const { data, error } = await klienAdmin().rpc("status_paket_efektif", { p_user: b.id } as never);
        if (error) throw error;
        hasil.set(b.id, (data as StatusPaket | null) ?? "gratis");
      }),
  );
  return hasil;
}

export async function kePenggunaAdmin(baris: BarisPenggunaAdmin[]): Promise<PenggunaAdmin[]> {
  const efektif = await paketEfektif(baris);
  return baris.map((b) => {
    const statusPaket = efektif.get(b.id) ?? "gratis";
    return {
      id: b.id,
      nama: b.nama,
      email: b.email,
      peran: b.peran,
      statusPaket,
      tanggalBerakhir: statusPaket === "gratis" ? null : b.tanggal_berakhir,
      isAktif: b.is_aktif,
      terdaftar: b.created_at,
      jumlahLatihan: b.riwayat_latihan?.[0]?.count ?? 0,
    };
  });
}
