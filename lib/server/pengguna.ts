import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { KUOTA_HARIAN_GRATIS } from "@/lib/paket";
import type { Pengguna, StatusPaket } from "@/lib/types";
import { klienAdmin } from "@/lib/supabase/admin";
import { buatKlienServer } from "@/lib/supabase/server";
import { GalatRute } from "./respons";

export const PESAN_NONAKTIF = "Akun Anda telah dinonaktifkan.";

/** Baris tabel public.users. */
export type BarisUsers = {
  id: string;
  nama: string;
  email: string;
  peran: "pengguna" | "admin";
  status_paket: StatusPaket;
  tanggal_berakhir: string | null;
  uji_coba_digunakan: boolean;
  tanggal_mulai_uji_coba: string | null;
  is_aktif: boolean;
  created_at: string;
};

export type KonteksPengguna = {
  supabase: SupabaseClient;
  uid: string;
  profil: BarisUsers;
  /** Status paket efektif (sudah memperhitungkan tanggal_berakhir). */
  paket: StatusPaket;
};

const KOLOM_USERS =
  "id, nama, email, peran, status_paket, tanggal_berakhir, uji_coba_digunakan, tanggal_mulai_uji_coba, is_aktif, created_at";

export async function ambilProfil(uid: string): Promise<BarisUsers | null> {
  const { data, error } = await klienAdmin()
    .from("users")
    .select(KOLOM_USERS)
    .eq("id", uid)
    .maybeSingle();
  if (error) throw error;
  return (data as BarisUsers | null) ?? null;
}

/**
 * Status paket efektif (SDD 3.2.4): uji coba/premium yang sudah lewat
 * tanggal_berakhir dianggap gratis, dan status di basis data ikut diperbarui.
 */
export async function segarkanPaket(profil: BarisUsers): Promise<BarisUsers> {
  if (profil.status_paket === "gratis") return profil;
  const berakhir = profil.tanggal_berakhir ? new Date(profil.tanggal_berakhir).getTime() : 0;
  if (berakhir > Date.now()) return profil;

  const { error } = await klienAdmin()
    .from("users")
    .update({ status_paket: "gratis" } as never)
    .eq("id", profil.id);
  if (error) console.error("[paket] gagal memperbarui paket kedaluwarsa", error);
  return { ...profil, status_paket: "gratis" };
}

export function kePengguna(profil: BarisUsers): Pengguna {
  return {
    id: profil.id,
    nama: profil.nama,
    email: profil.email,
    peran: profil.peran,
    statusPaket: profil.status_paket,
    tanggalBerakhir: profil.status_paket === "gratis" ? null : profil.tanggal_berakhir,
  };
}

/**
 * Memastikan permintaan berasal dari pengguna yang masuk dan akunnya aktif.
 * Akun nonaktif langsung dikeluarkan (SDD 3.2.7).
 */
export async function wajibLogin(opsi: { peran?: "admin" } = {}): Promise<KonteksPengguna> {
  const supabase = await buatKlienServer();
  const { data, error } = await supabase.auth.getClaims();
  const uid = data?.claims?.sub;
  if (error || !uid) {
    throw new GalatRute(401, "Sesi Anda telah berakhir. Silakan masuk kembali.", "belum_masuk");
  }

  const ditemukan = await ambilProfil(uid);
  if (!ditemukan) {
    await supabase.auth.signOut();
    throw new GalatRute(401, "Profil akun tidak ditemukan. Silakan masuk kembali.", "belum_masuk");
  }
  if (!ditemukan.is_aktif) {
    await supabase.auth.signOut();
    throw new GalatRute(403, PESAN_NONAKTIF, "akun_nonaktif");
  }
  if (opsi.peran === "admin" && ditemukan.peran !== "admin") {
    throw new GalatRute(403, "Halaman ini khusus admin.", "bukan_admin");
  }

  const profil = await segarkanPaket(ditemukan);
  return { supabase, uid, profil, paket: profil.status_paket };
}

/** Fitur riwayat dan progres hanya untuk Premium dan Uji Coba. */
export function wajibPremium(konteks: KonteksPengguna) {
  if (konteks.paket === "gratis") {
    throw new GalatRute(
      403,
      "Riwayat dan grafik progres khusus pengguna Premium.",
      "khusus_premium",
    );
  }
}

/**
 * Sisa kuota analisis hari ini (SDD 3.2.5): kuota dikurangi jumlah sesi
 * berstatus selesai sejak 00.00 WIB. null berarti tanpa batas.
 */
export async function sisaKuotaHariIni(uid: string, paket: StatusPaket): Promise<number | null> {
  if (paket !== "gratis") return null;
  const { data, error } = await klienAdmin().rpc("jumlah_sesi_selesai_hari_ini", {
    p_user: uid,
  } as never);
  if (error) throw error;
  return Math.max(0, KUOTA_HARIAN_GRATIS - Number(data ?? 0));
}
