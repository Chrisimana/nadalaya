import { Midi } from "@tonejs/midi";

export const UKURAN_MAKS_MIDI = 1024 * 1024;
const TOLERANSI_TUMPANG_DETIK = 0.01;

export type HasilValidasiMidi =
  | { sah: true; jumlahNada: number; durasi: number }
  | { sah: false; pesan: string };

export function validasiIsiMidi(nama: string, isi: Uint8Array): HasilValidasiMidi {
  if (!nama.toLowerCase().endsWith(".mid")) {
    return { sah: false, pesan: "Berkas harus berformat .mid." };
  }
  if (isi.byteLength === 0) return { sah: false, pesan: "Berkas MIDI kosong." };
  if (isi.byteLength > UKURAN_MAKS_MIDI) {
    return { sah: false, pesan: "Ukuran berkas MIDI maksimal 1 MB." };
  }

  let midi: Midi;
  try {
    midi = new Midi(isi);
  } catch {
    return { sah: false, pesan: "Berkas tidak dapat dibaca sebagai MIDI." };
  }

  const nada = midi.tracks.flatMap((t) => t.notes).sort((a, b) => a.time - b.time);
  if (nada.length === 0) return { sah: false, pesan: "Berkas MIDI tidak berisi nada." };

  for (let i = 1; i < nada.length; i++) {
    const sebelum = nada[i - 1];
    if (sebelum.time + sebelum.duration - nada[i].time > TOLERANSI_TUMPANG_DETIK) {
      return {
        sah: false,
        pesan: `Berkas MIDI harus berisi melodi tunggal. Ditemukan nada yang berbunyi bersamaan pada detik ${nada[i].time.toFixed(1)}.`,
      };
    }
  }

  const durasi = Math.max(...nada.map((n) => n.time + n.duration));
  return { sah: true, jumlahNada: nada.length, durasi };
}
