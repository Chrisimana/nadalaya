import "server-only";

import { validasiIsiMidi } from "@/lib/audio/validasiMidi";
import { klienAdmin } from "@/lib/supabase/admin";
import type { JenisMateri, MateriAdmin } from "@/lib/types";
import { TEMPO_MAX, TEMPO_MIN } from "@/lib/validasi";
import { JENIS_SAH, keTingkat } from "./admin";
import { keMateri, type BarisMateri } from "./materi";
import { GalatRute } from "./respons";

const BUCKET = "midi";

export const KOLOM_MATERI_ADMIN =
  "id, judul, jenis, tingkat, is_premium, tempo_bpm, midi_path, is_aktif, sesi_analisis(count), riwayat_latihan(count)";

export type BarisMateriAdmin = BarisMateri & {
  sesi_analisis: { count: number }[];
  riwayat_latihan: { count: number }[];
};

export function keMateriAdmin(baris: BarisMateriAdmin): MateriAdmin {
  const dipakai = (baris.sesi_analisis?.[0]?.count ?? 0) + (baris.riwayat_latihan?.[0]?.count ?? 0);
  return {
    ...keMateri(baris, "premium"),
    isAktif: baris.is_aktif,
    dipakaiLatihan: dipakai > 0,
    namaBerkasMidi: baris.midi_path,
  };
}

export type DataFormMateri = {
  judul: string;
  jenis: JenisMateri;
  tingkat: number;
  is_premium: boolean;
  tempo_bpm: number;
};

export type BerkasMidi = { nama: string; isi: Uint8Array };

function galat(pesan: string): never {
  throw new GalatRute(400, pesan, "data_tidak_valid");
}

export async function bacaFormMateri(
  req: Request,
  berkasWajib: boolean,
): Promise<{ data: DataFormMateri; berkas: BerkasMidi | null }> {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw new GalatRute(400, "Permintaan tidak valid.", "permintaan_tidak_valid");
  }

  const judul = String(form.get("judul") ?? "").trim();
  if (!judul) galat("Judul wajib diisi.");
  if (judul.length > 100) galat("Judul maksimal 100 karakter.");

  const jenis = String(form.get("jenis") ?? "") as JenisMateri;
  if (!JENIS_SAH.includes(jenis)) galat("Jenis materi tidak valid.");

  const tingkat = keTingkat(form.get("tingkat"));
  if (tingkat === null) galat("Tingkat harus 1–3 (dasar, menengah, atau mahir).");

  const tempo = Number(form.get("tempo"));
  if (!Number.isInteger(tempo) || tempo < TEMPO_MIN || tempo > TEMPO_MAX) {
    galat(`Tempo harus bilangan bulat ${TEMPO_MIN}–${TEMPO_MAX} BPM.`);
  }

  const isPremium = form.get("isPremium") === "true";

  const nilaiBerkas = form.get("berkas");
  let berkas: BerkasMidi | null = null;
  if (nilaiBerkas instanceof File && nilaiBerkas.size > 0) {
    const isi = new Uint8Array(await nilaiBerkas.arrayBuffer());
    const hasil = validasiIsiMidi(nilaiBerkas.name, isi);
    if (!hasil.sah) galat(hasil.pesan);
    berkas = { nama: nilaiBerkas.name, isi };
  } else if (berkasWajib) {
    galat("Berkas MIDI wajib diunggah.");
  }

  return {
    data: { judul, jenis, tingkat: tingkat!, is_premium: isPremium, tempo_bpm: tempo },
    berkas,
  };
}

export function slug(teks: string) {
  return (
    teks
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "materi"
  );
}

export async function unggahMidi(judul: string, berkas: BerkasMidi): Promise<string> {
  const path = `${slug(judul)}-${crypto.randomUUID().slice(0, 8)}.mid`;
  const { error } = await klienAdmin()
    .storage.from(BUCKET)
    .upload(path, berkas.isi, { contentType: "audio/midi", upsert: false });
  if (error) {
    console.error("[midi] unggah gagal", error);
    throw new GalatRute(502, "Berkas MIDI gagal diunggah. Silakan coba lagi.", "unggah_gagal");
  }
  return path;
}

export async function hapusBerkasMidi(path: string) {
  const { error } = await klienAdmin().storage.from(BUCKET).remove([path]);
  if (error) console.error("[midi] hapus berkas gagal", path, error);
}
