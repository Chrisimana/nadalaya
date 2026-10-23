/*
 * Uji validasi berkas MIDI materi (UC-21, UC-22, SDD 3.2.8).
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Midi } from "@tonejs/midi";
import { describe, expect, it } from "vitest";
import { UKURAN_MAKS_MIDI, validasiIsiMidi } from "@/lib/audio/validasiMidi";

const FOLDER_MIDI = join(process.cwd(), "scripts", "midi");

/** MIDI buatan: daftar [nomor nada, mulai, durasi] dalam detik. */
function buatMidi(nada: Array<[number, number, number]>, jumlahTrek = 1) {
  const midi = new Midi();
  midi.header.setTempo(120);
  for (let t = 0; t < jumlahTrek; t++) {
    const trek = midi.addTrack();
    nada.forEach(([n, waktu, durasi], i) => {
      if (i % jumlahTrek === t) trek.addNote({ midi: n, time: waktu, duration: durasi });
    });
  }
  return midi.toArray();
}

describe("validasi berkas MIDI", () => {
  const berkasSeed = readdirSync(FOLDER_MIDI).filter((f) => f.endsWith(".mid"));

  it.each(berkasSeed)("berkas seed %s valid", (nama) => {
    const hasil = validasiIsiMidi(nama, readFileSync(join(FOLDER_MIDI, nama)));
    expect(hasil).toMatchObject({ sah: true });
  });

  it("melodi tunggal yang dibagi ke dua trek tetap valid", () => {
    const isi = buatMidi([[60, 0, 0.5], [62, 0.5, 0.5], [64, 1, 0.5]], 2);
    expect(validasiIsiMidi("dua-trek.mid", isi)).toMatchObject({ sah: true, jumlahNada: 3 });
  });

  it("menolak berkas yang bukan MIDI", () => {
    const isi = new TextEncoder().encode("Ini berkas teks biasa, bukan MIDI.");
    expect(validasiIsiMidi("palsu.mid", isi)).toEqual({
      sah: false,
      pesan: "Berkas tidak dapat dibaca sebagai MIDI.",
    });
  });

  it("menolak ekstensi selain .mid", () => {
    const isi = readFileSync(join(FOLDER_MIDI, "do-mayor.mid"));
    expect(validasiIsiMidi("do-mayor.mp3", isi)).toMatchObject({ sah: false });
  });

  it("menolak berkas kosong (0 bita)", () => {
    expect(validasiIsiMidi("kosong.mid", new Uint8Array())).toEqual({ sah: false, pesan: "Berkas MIDI kosong." });
  });

  it("menolak MIDI tanpa nada", () => {
    expect(validasiIsiMidi("tanpa-nada.mid", buatMidi([]))).toEqual({
      sah: false,
      pesan: "Berkas MIDI tidak berisi nada.",
    });
  });

  it("menolak MIDI dengan nada yang berbunyi bersamaan (akor)", () => {
    const isi = buatMidi([[60, 0, 1], [64, 0, 1], [67, 1, 1]]);
    const hasil = validasiIsiMidi("akor.mid", isi);
    expect(hasil.sah).toBe(false);
    if (!hasil.sah) expect(hasil.pesan).toMatch(/melodi tunggal/);
  });

  it("menolak nada tumpang tindih antar-trek", () => {
    const isi = buatMidi([[60, 0, 1], [72, 0.5, 1]], 2);
    expect(validasiIsiMidi("tumpang.mid", isi).sah).toBe(false);
  });

  it("menoleransi tumpang tindih legato ≤ 10 ms", () => {
    const isi = buatMidi([[60, 0, 0.505], [62, 0.5, 0.5]]);
    expect(validasiIsiMidi("legato.mid", isi).sah).toBe(true);
  });

  it("menolak berkas lebih dari 1 MB", () => {
    const isi = new Uint8Array(UKURAN_MAKS_MIDI + 1);
    expect(validasiIsiMidi("besar.mid", isi)).toEqual({ sah: false, pesan: "Ukuran berkas MIDI maksimal 1 MB." });
  });
});
