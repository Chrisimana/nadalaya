import "server-only";

import type { JenisMateri, Materi, StatusPaket, TingkatMateri } from "@/lib/types";
import { klienAdmin } from "@/lib/supabase/admin";
import { GalatRute } from "./respons";

/** Baris tabel public.materi_latihan. */
export type BarisMateri = {
  id: string;
  judul: string;
  jenis: JenisMateri;
  tingkat: number;
  is_premium: boolean;
  tempo_bpm: number;
  midi_path: string;
  is_aktif: boolean;
};

export const KOLOM_MATERI = "id, judul, jenis, tingkat, is_premium, tempo_bpm, midi_path, is_aktif";

const TINGKAT: Record<number, TingkatMateri> = { 1: "dasar", 2: "menengah", 3: "mahir" };

/** Materi premium terkunci bagi pengguna Gratis (FR-07). */
export function keMateri(baris: BarisMateri, paket: StatusPaket): Materi {
  return {
    id: baris.id,
    judul: baris.judul,
    jenis: baris.jenis,
    tingkat: TINGKAT[baris.tingkat] ?? "dasar",
    isPremium: baris.is_premium,
    tempo: baris.tempo_bpm,
    terkunci: baris.is_premium && paket === "gratis",
  };
}

/** Materi aktif berdasarkan ID; galat 404 bila tidak ada atau nonaktif. */
export async function ambilMateriAktif(materiId: string): Promise<BarisMateri> {
  const { data, error } = await klienAdmin()
    .from("materi_latihan")
    .select(KOLOM_MATERI)
    .eq("id", materiId)
    .eq("is_aktif", true)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    throw new GalatRute(404, "Materi tidak ditemukan atau sudah tidak tersedia.", "materi_tidak_ditemukan");
  }
  return data as BarisMateri;
}

/** Signed URL berkas MIDI dari bucket privat "midi", berlaku 10 menit. */
export async function urlMidi(path: string): Promise<string> {
  const { data, error } = await klienAdmin().storage.from("midi").createSignedUrl(path, 600);
  if (error || !data?.signedUrl) {
    console.error("[midi] signed URL gagal", path, error);
    throw new GalatRute(502, "Berkas acuan nada tidak dapat dimuat. Coba lagi nanti.", "midi_gagal");
  }
  return data.signedUrl;
}
