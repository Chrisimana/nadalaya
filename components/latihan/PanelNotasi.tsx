"use client";

import { Music } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { kunciVexflow } from "@/lib/audio/nada";
import type { NadaAcuan } from "@/lib/types";

const WARNA_NOT = "#2e2a6b";
const WARNA_AKTIF = "#d4872a";
const LEBAR_PER_NOT = 48;
const TINGGI = 150;

/** Durasi VexFlow terdekat dari jumlah ketukan (ketukan = not seperempat). */
const DURASI: Array<[number, string]> = [
  [4, "w"],
  [2, "h"],
  [1, "q"],
  [0.5, "8"],
  [0.25, "16"],
];

function durasiTerdekat(ketukan: number) {
  let terbaik = DURASI[0];
  for (const d of DURASI) {
    if (Math.abs(Math.log2(d[0] / ketukan)) < Math.abs(Math.log2(terbaik[0] / ketukan))) {
      terbaik = d;
    }
  }
  return terbaik[1];
}

type Props = {
  nada: NadaAcuan[] | null | undefined;
  /** Tempo (BPM) untuk mengubah detik menjadi nilai not. */
  tempo?: number;
  /** Indeks nada yang sedang diputar, ditandai dengan warna aksen. */
  indeksAktif?: number | null;
};

/**
 * Notasi balok dari deret nada acuan (UC-10), dirender dengan VexFlow.
 * Menampilkan keadaan kosong bila belum ada data nada.
 */
export function PanelNotasi({ nada, tempo = 80, indeksAktif = null }: Props) {
  const wadah = useRef<HTMLDivElement>(null);
  const [galat, setGalat] = useState(false);
  const ada = !!nada && nada.length > 0;

  useEffect(() => {
    const el = wadah.current;
    if (!el || !nada || nada.length === 0) return;
    let batal = false;

    (async () => {
      try {
        const VF = await import("vexflow/bravura");
        await document.fonts.ready;
        if (batal) return;
        const { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } = VF;

        el.innerHTML = "";
        const rataRata = nada.reduce((s, n) => s + n.midi, 0) / nada.length;
        const kunci = rataRata < 57 ? "bass" : "treble";
        const detikPerKetukan = 60 / tempo;

        // Susun not, sisipkan tanda diam bila ada jeda di antara nada.
        const not: InstanceType<typeof StaveNote>[] = [];
        const indeksNot: number[] = [];
        let akhirSebelumnya = 0;
        nada.forEach((n, i) => {
          const jeda = (n.waktu - akhirSebelumnya) / detikPerKetukan;
          if (jeda >= 0.25) {
            not.push(
              new StaveNote({
                keys: [kunci === "bass" ? "d/3" : "b/4"],
                duration: `${durasiTerdekat(jeda)}r`,
                clef: kunci,
              }),
            );
          }
          const kunciNot = kunciVexflow(n.midi);
          const sn = new StaveNote({
            keys: [kunciNot],
            duration: durasiTerdekat(n.durasi / detikPerKetukan),
            clef: kunci,
            autoStem: true,
          });
          if (kunciNot.includes("#")) sn.addModifier(new Accidental("#"), 0);
          const warna = i === indeksAktif ? WARNA_AKTIF : WARNA_NOT;
          sn.setStyle({ fillStyle: warna, strokeStyle: warna });
          indeksNot.push(not.length);
          not.push(sn);
          akhirSebelumnya = n.waktu + n.durasi;
        });

        const lebar = Math.max(el.clientWidth, 90 + not.length * LEBAR_PER_NOT);
        const renderer = new Renderer(el, Renderer.Backends.SVG);
        renderer.resize(lebar, TINGGI);
        const ctx = renderer.getContext();
        const stave = new Stave(0, 20, lebar - 1);
        stave.addClef(kunci).setContext(ctx).draw();

        const voice = new Voice({ numBeats: 4, beatValue: 4 })
          .setMode(Voice.Mode.SOFT)
          .addTickables(not);
        new Formatter()
          .joinVoices([voice])
          .format([voice], lebar - stave.getNoteStartX() - 20);
        voice.draw(ctx, stave);

        const svg = el.querySelector("svg");
        svg?.setAttribute("role", "img");
        svg?.setAttribute("aria-label", "Notasi balok materi latihan");
        setGalat(false);

        // Gulirkan not aktif ke tengah area bila notasi lebih lebar dari layar.
        if (indeksAktif !== null) {
          const target = not[indeksNot[indeksAktif]];
          const x = target?.getAbsoluteX();
          if (x !== undefined) {
            el.scrollTo({ left: x - el.clientWidth / 2, behavior: "smooth" });
          }
        }
      } catch {
        if (!batal) setGalat(true);
      }
    })();

    return () => {
      batal = true;
    };
  }, [nada, tempo, indeksAktif]);

  if (!ada) {
    return (
      <EmptyState
        ringkas
        ikon={Music}
        judul="Notasi belum tersedia"
        deskripsi="Notasi balok akan tampil setelah data nada acuan materi tersedia."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {galat && (
        <Alert varian="galat" judul="Notasi gagal ditampilkan">
          Muat ulang halaman untuk mencoba lagi.
        </Alert>
      )}
      <div
        ref={wadah}
        className="min-h-[150px] overflow-x-auto rounded-xl border border-garis bg-white"
      />
    </div>
  );
}
