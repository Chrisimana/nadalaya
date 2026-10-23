"use client";

import { Music } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { kunciVexflow } from "@/lib/audio/nada";
import { susunBirama, type TokenNotasi } from "@/lib/audio/notasi";
import type { NadaAcuan } from "@/lib/types";

const WARNA_NOT = "#2e2a6b";
const WARNA_AKTIF = "#d4872a";
const TINGGI_BARIS = 120;
const LEBAR_MIN_BIRAMA = 190;
const RUANG_KUNCI = 50;

const DURASI_VF: Record<TokenNotasi["ketukan"], string> = { 4: "w", 2: "h", 1: "q", 0.5: "8" };

type Props = {
  nada: NadaAcuan[] | null | undefined;
  tempo?: number;
  indeksAktif?: number | null;
};

export function PanelNotasi({ nada, tempo = 80, indeksAktif = null }: Props) {
  const wadah = useRef<HTMLDivElement>(null);
  const [lebar, setLebar] = useState(0);
  const [galat, setGalat] = useState(false);
  const birama = useMemo(() => (nada && nada.length > 0 ? susunBirama(nada, tempo) : []), [nada, tempo]);

  // Gambar ulang saat lebar wadah berubah (responsif).
  useEffect(() => {
    const el = wadah.current;
    if (!el) return;
    const amati = new ResizeObserver(([entri]) => {
      setLebar(Math.floor(entri.contentRect.width));
    });
    amati.observe(el);
    return () => amati.disconnect();
  }, [birama.length]);

  useEffect(() => {
    const el = wadah.current;
    if (!el || birama.length === 0 || lebar === 0) return;
    let batal = false;

    (async () => {
      try {
        const VF = await import("vexflow/bravura");
        await document.fonts.ready;
        if (batal) return;
        const { Renderer, Stave, StaveNote, Voice, Formatter, Accidental, Beam, StaveTie } = VF;

        el.innerHTML = "";
        const perBaris = Math.max(1, Math.min(4, Math.floor((lebar - RUANG_KUNCI) / LEBAR_MIN_BIRAMA)));
        const jumlahBaris = Math.ceil(birama.length / perBaris);
        const lebarBirama = (lebar - RUANG_KUNCI - 2) / perBaris;

        const renderer = new Renderer(el, Renderer.Backends.SVG);
        renderer.resize(lebar, jumlahBaris * TINGGI_BARIS + 10);
        const ctx = renderer.getContext();

        // Semua not dalam urutan, untuk menggambar tie lintas birama.
        const urutan: { not: InstanceType<typeof StaveNote>; token: TokenNotasi }[] = [];

        birama.forEach((isi, b) => {
          const baris = Math.floor(b / perBaris);
          const kolom = b % perBaris;
          const awalBaris = kolom === 0;
          const x = awalBaris ? 0 : RUANG_KUNCI + kolom * lebarBirama;
          const stave = new Stave(x, baris * TINGGI_BARIS, lebarBirama + (awalBaris ? RUANG_KUNCI : 0));
          if (awalBaris) stave.addClef("treble");
          if (b === 0) stave.addTimeSignature("4/4");
          stave.setContext(ctx).draw();

          const not = isi.map((token) => {
            if (token.midi === null) {
              return new StaveNote({ keys: ["b/4"], duration: `${DURASI_VF[token.ketukan]}r`, clef: "treble" });
            }
            const kunci = kunciVexflow(token.midi);
            const sn = new StaveNote({
              keys: [kunci],
              duration: DURASI_VF[token.ketukan],
              clef: "treble",
              autoStem: true,
            });
            if (kunci.includes("#")) sn.addModifier(new Accidental("#"), 0);
            const warna = token.indeksNada !== null && token.indeksNada === indeksAktif ? WARNA_AKTIF : WARNA_NOT;
            sn.setStyle({ fillStyle: warna, strokeStyle: warna });
            return sn;
          });
          not.forEach((n, i) => urutan.push({ not: n, token: isi[i] }));

          const voice = new Voice({ numBeats: 4, beatValue: 4 }).setMode(Voice.Mode.SOFT).addTickables(not);
          const balok = Beam.generateBeams(not.filter((_, i) => isi[i].midi !== null));
          new Formatter().joinVoices([voice]).format([voice], stave.getNoteEndX() - stave.getNoteStartX() - 10);
          voice.draw(ctx, stave);
          balok.forEach((bl) => bl.setContext(ctx).draw());
        });

        urutan.forEach(({ not, token }, i) => {
          const berikut = urutan[i + 1];
          if (!token.sambung || !berikut || berikut.token.midi === null) return;
          new StaveTie({ firstNote: not, lastNote: berikut.not, firstIndexes: [0], lastIndexes: [0] })
            .setContext(ctx)
            .draw();
        });

        const svg = el.querySelector("svg");
        svg?.setAttribute("role", "img");
        svg?.setAttribute("aria-label", "Notasi balok materi latihan");
        setGalat(false);
      } catch {
        if (!batal) setGalat(true);
      }
    })();

    return () => {
      batal = true;
    };
  }, [birama, lebar, indeksAktif]);

  if (birama.length === 0) {
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
      <div ref={wadah} className="min-h-[130px] w-full rounded-xl border border-garis bg-white px-2 pt-2" />
    </div>
  );
}
