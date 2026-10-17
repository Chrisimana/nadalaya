import { muatNadaMidi } from "@/lib/audio/midi";
import type { HasilCekAkses, Materi, MateriLengkap } from "@/lib/types";
import { GalatApi } from "./galat";
import { minta } from "./klien";

export type DataLatihan = {
  akses: HasilCekAkses;
  /** Bila akses ditolak, `nada` kosong karena berkas MIDI tidak dibagikan. */
  materi: MateriLengkap;
};

/**
 * UC-08 langkah 1.1 / UC-09 Memeriksa Hak Akses dan Kuota (FR-08, FR-09).
 * Dipanggil saat pengguna memilih materi. Bila diizinkan, berkas MIDI
 * diunduh lewat signed URL lalu dibaca menjadi deret nada acuan.
 */
export async function bukaLatihan(materiId: string): Promise<DataLatihan> {
  const hasil = await minta<{ akses: HasilCekAkses; materi: Materi; midiUrl?: string }>(
    "/api/latihan/akses",
    { method: "POST", body: { materiId } },
  );
  if (!hasil.akses.diizinkan || !hasil.midiUrl) {
    return { akses: hasil.akses, materi: { ...hasil.materi, nada: [] } };
  }

  try {
    const nada = await muatNadaMidi(hasil.midiUrl);
    return { akses: hasil.akses, materi: { ...hasil.materi, nada } };
  } catch {
    throw new GalatApi(
      "Berkas acuan nada gagal dimuat. Periksa koneksi internet, lalu muat ulang.",
      502,
      "midi_gagal",
    );
  }
}

/**
 * Dipanggil setiap kali tombol Analisis ditekan: server memeriksa ulang kuota,
 * lalu mencatat sesi_analisis berstatus "dimulai" dan mengembalikan ID sesi.
 */
export async function mulaiSesiAnalisis(
  materiId: string,
): Promise<{ sesiId: string } | Extract<HasilCekAkses, { diizinkan: false }>> {
  const hasil = await minta<
    { sesiId: string } | { ditolak: Extract<HasilCekAkses, { diizinkan: false }> }
  >("/api/sesi", { method: "POST", body: { materiId } });
  return "ditolak" in hasil ? hasil.ditolak : hasil;
}

/** Menandai sesi batal (rekaman terlalu pendek, tanpa suara, model gagal dimuat). */
export async function batalkanSesiAnalisis(sesiId: string): Promise<void> {
  await minta(`/api/sesi/${encodeURIComponent(sesiId)}/batal`, { method: "POST" });
}
