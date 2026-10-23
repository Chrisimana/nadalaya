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
  type PointStyle,
} from "chart.js";
import { Line } from "react-chartjs-2";
import {
  LABEL_JENIS,
  URUTAN_JENIS,
  type JenisMateri,
  type TitikProgres,
} from "@/lib/types";

ChartJS.register(LinearScale, LineElement, PointElement, Tooltip, Legend);

const GAYA_SERI: Record<JenisMateri, { warna: string; titik: PointStyle }> = {
  tangga_nada: { warna: "#5f54ae", titik: "circle" },
  interval: { warna: "#c2771f", titik: "rectRounded" },
  melodi: { warna: "#0d9488", titik: "triangle" },
};
const WARNA_TEKS = "#5b6075";
const WARNA_GRID = "#ece9e1";

function formatSumbu(ms: number) {
  return new Date(ms).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Jakarta",
  });
}

export function GrafikProgres({ titik }: { titik: TitikProgres[] }) {
  const seri = URUTAN_JENIS.map((jenis) => ({
    jenis,
    data: titik
      .filter((t) => t.jenis === jenis)
      .map((t) => ({ x: new Date(t.tanggal).getTime(), y: t.skor }))
      .sort((a, b) => a.x - b.x),
  })).filter((s) => s.data.length > 0);

  const data: ChartData<"line", { x: number; y: number }[]> = {
    datasets: seri.map(({ jenis, data }) => ({
      label: LABEL_JENIS[jenis],
      data,
      borderColor: GAYA_SERI[jenis].warna,
      backgroundColor: GAYA_SERI[jenis].warna,
      pointStyle: GAYA_SERI[jenis].titik,
      borderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBorderColor: "#ffffff",
      pointBorderWidth: 2,
      tension: 0.25,
    })),
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    parsing: false,
    interaction: { mode: "nearest", intersect: false },
    plugins: {
      legend: {
        position: "top",
        align: "start",
        labels: { color: WARNA_TEKS, usePointStyle: true, font: { size: 12 } },
      },
      tooltip: {
        backgroundColor: "#ffffff",
        borderColor: "#e7e3d8",
        borderWidth: 1,
        titleColor: "#1f2333",
        bodyColor: "#1f2333",
        padding: 10,
        usePointStyle: true,
        callbacks: {
          title: (items) => formatSumbu(items[0]?.parsed.x ?? 0),
          label: (item) => `${item.dataset.label}: ${Math.round(item.parsed.y ?? 0)}`,
        },
      },
    },
    scales: {
      x: {
        type: "linear",
        ticks: {
          color: WARNA_TEKS,
          maxTicksLimit: 7,
          callback: (v) => formatSumbu(Number(v)),
        },
        grid: { color: WARNA_GRID },
        border: { display: false },
      },
      y: {
        type: "linear",
        min: 0,
        max: 100,
        title: { display: true, text: "Skor", color: WARNA_TEKS },
        ticks: { color: WARNA_TEKS, stepSize: 20 },
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
        role="img"
        aria-label="Grafik perkembangan skor latihan per jenis materi"
      />
    </div>
  );
}
