import { muatMidi } from "@/lib/audio/midi";
import { tempoEfektif } from "@/lib/audio/notasi";
import type { HasilCekAkses, Materi, MateriLengkap } from "@/lib/types";
import { GalatApi } from "./galat";
import { minta } from "./klien";

export type DataLatihan = {
  akses: HasilCekAkses;
  materi: MateriLengkap;
};

export async function bukaLatihan(materiId: string): Promise<DataLatihan> {
  const hasil = await minta<{ akses: HasilCekAkses; materi: Materi; midiUrl?: string }>(
    "/api/latihan/akses",
    { method: "POST", body: { materiId } },
  );
  if (!hasil.akses.diizinkan || !hasil.midiUrl) {
    return { akses: hasil.akses, materi: { ...hasil.materi, nada: [] } };
  }

  try {
    const { nada, tempo } = await muatMidi(hasil.midiUrl);
    return {
      akses: hasil.akses,
      materi: { ...hasil.materi, nada, tempo: tempoEfektif(tempo, hasil.materi.tempo) },
    };
  } catch {
    throw new GalatApi(
      "Berkas acuan nada gagal dimuat. Periksa koneksi internet, lalu muat ulang.",
      502,
      "midi_gagal",
    );
  }
}

export async function mulaiSesiAnalisis(
  materiId: string,
): Promise<{ sesiId: string } | Extract<HasilCekAkses, { diizinkan: false }>> {
  const hasil = await minta<
    { sesiId: string } | { ditolak: Extract<HasilCekAkses, { diizinkan: false }> }
  >("/api/sesi", { method: "POST", body: { materiId } });
  return "ditolak" in hasil ? hasil.ditolak : hasil;
}

export async function batalkanSesiAnalisis(sesiId: string): Promise<void> {
  await minta(`/api/sesi/${encodeURIComponent(sesiId)}/batal`, { method: "POST" });
}
