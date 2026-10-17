"use client";

import {
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { namaNada } from "@/lib/audio/nada";
import type { NadaAcuan, NadaMeleset, TitikPitch } from "@/lib/types";

ChartJS.register(LinearScale, LineElement, PointElement, Tooltip, Legend);

// Pasangan warna lolos validator palet (lightness, CVD, kontras) pada latar putih.
const WARNA_ACUAN = "#5f54ae";
const WARNA_NYANYIAN = "#b06a21";
const WARNA_MELESET = "#dc2626";
const WARNA_TEKS = "#5b6075";
const WARNA_GRID = "#ece9e1";

type Titik = { x: number; y: number | null };

function formatCent(midi: number) {
  const cent = Math.round((midi - Math.round(midi)) * 100);
  return `${namaNada(midi)}${cent === 0 ? "" : ` ${cent > 0 ? "+" : "−"}${Math.abs(cent)} cent`}`;
}

type Props = {
  acuan: NadaAcuan[];
  /** Kontur nyanyian pada sumbu waktu acuan (hasil penyelarasan DTW). */
  kontur: TitikPitch[];
  nadaMeleset: NadaMeleset[];
};

/** FR-15 Grafik pitch nyanyian dibandingkan pitch acuan. */
export function GrafikPitch({ acuan, kontur, nadaMeleset }: Props) {
  // Acuan digambar sebagai anak tangga per nada, terputus di antara nada.
  const titikAcuan: Titik[] = acuan.flatMap((n) => [
    { x: n.waktu, y: n.midi },
    { x: n.waktu + n.durasi, y: n.midi },
    { x: n.waktu + n.durasi, y: null },
  ]);
  const titikNyanyian: Titik[] = kontur.map((t) => ({ x: t.waktu, y: t.midi }));
  const titikMeleset: Titik[] = nadaMeleset.map((m) => {
    const nada = acuan[m.urutan - 1];
    return {
      x: nada ? nada.waktu + nada.durasi / 2 : m.waktu,
      y: m.midiAcuan + (m.selisihCent ?? 0) / 100,
    };
  });

  const semuaMidi = [
    ...acuan.map((n) => n.midi),
    ...kontur.flatMap((t) => (t.midi === null ? [] : [t.midi])),
  ];
  const minY = Math.floor(Math.min(...semuaMidi)) - 1;
  const maxY = Math.ceil(Math.max(...semuaMidi)) + 1;

  const data: ChartData<"line", Titik[]> = {
    datasets: [
      {
        label: "Acuan",
        data: titikAcuan,
        borderColor: WARNA_ACUAN,
        backgroundColor: WARNA_ACUAN,
        borderWidth: 3,
        pointRadius: 0,
        pointHoverRadius: 0,
        spanGaps: false,
      },
      {
        label: "Nyanyian Anda (diselaraskan)",
        data: titikNyanyian,
        borderColor: WARNA_NYANYIAN,
        backgroundColor: WARNA_NYANYIAN,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.2,
        spanGaps: false,
      },
      {
        label: "Nada meleset > 50 cent",
        data: titikMeleset,
        showLine: false,
        borderColor: "#ffffff",
        backgroundColor: WARNA_MELESET,
        borderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointStyle: "triangle",
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400 },
    parsing: false,
    interaction: { mode: "nearest", axis: "x", intersect: false },
    plugins: {
      legend: {
        position: "top",
        align: "start",
        labels: {
          color: WARNA_TEKS,
          usePointStyle: true,
          pointStyleWidth: 18,
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: "#ffffff",
        borderColor: "#e7e3d8",
        borderWidth: 1,
        titleColor: "#1f2333",
        bodyColor: "#1f2333",
        padding: 10,
        boxPadding: 4,
        usePointStyle: true,
        filter: (item) => item.parsed.y !== null,
        callbacks: {
          title: (items) => `Detik ${(items[0]?.parsed.x ?? 0).toFixed(1)}`,
          label: (item) => {
            const y = item.parsed.y ?? 0;
            if (item.datasetIndex === 0) return `Acuan: ${namaNada(y)}`;
            if (item.datasetIndex === 2) {
              const m = nadaMeleset[item.dataIndex];
              if (m.selisihCent === null) return `Nada ke-${m.urutan}: tidak terdeteksi`;
              return `Meleset: nada ke-${m.urutan}, ${m.selisihCent > 0 ? "+" : "−"}${Math.abs(Math.round(m.selisihCent))} cent`;
            }
            return `Anda: ${formatCent(y)}`;
          },
        },
      },
    },
    scales: {
      x: {
        type: "linear",
        title: { display: true, text: "Waktu (detik)", color: WARNA_TEKS },
        ticks: { color: WARNA_TEKS, maxTicksLimit: 8 },
        grid: { color: WARNA_GRID },
        border: { display: false },
      },
      y: {
        type: "linear",
        min: minY,
        max: maxY,
        title: { display: true, text: "Nada", color: WARNA_TEKS },
        // Garis grid tiap semiton; label hanya untuk nada natural (C, D, E, …).
        ticks: {
          color: WARNA_TEKS,
          stepSize: 1,
          autoSkip: false,
          callback: (v) => {
            if (!Number.isInteger(v)) return "";
            const nama = namaNada(Number(v));
            return nama.includes("#") ? "" : nama;
          },
        },
        grid: { color: WARNA_GRID },
        border: { display: false },
      },
    },
  };

  return (
    <div className="relative h-72 w-full sm:h-80">
      <Line
        data={data}
        options={options}
        aria-label="Grafik nada nyanyian Anda dibandingkan nada acuan"
        role="img"
      />
    </div>
  );
}
