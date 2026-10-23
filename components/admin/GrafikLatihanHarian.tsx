"use client";

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

const WARNA_BATANG = "#5f54ae";
const WARNA_TEKS = "#5b6075";
const WARNA_GRID = "#ece9e1";

function formatHari(tanggal: string) {
  return new Date(`${tanggal}T00:00:00+07:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Jakarta",
  });
}

export function GrafikLatihanHarian({
  perHari,
}: {
  perHari: { tanggal: string; jumlah: number }[];
}) {
  const data: ChartData<"bar"> = {
    labels: perHari.map((h) => formatHari(h.tanggal)),
    datasets: [
      {
        label: "Jumlah latihan",
        data: perHari.map((h) => h.jumlah),
        backgroundColor: WARNA_BATANG,
        borderRadius: { topLeft: 4, topRight: 4 },
        borderSkipped: "bottom",
        maxBarThickness: 28,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#ffffff",
        borderColor: "#e7e3d8",
        borderWidth: 1,
        titleColor: "#1f2333",
        bodyColor: "#1f2333",
        padding: 10,
        callbacks: { label: (item) => `${item.parsed.y} latihan` },
      },
    },
    scales: {
      x: {
        ticks: { color: WARNA_TEKS, maxRotation: 0, autoSkip: true },
        grid: { display: false },
        border: { color: WARNA_GRID },
      },
      y: {
        beginAtZero: true,
        ticks: { color: WARNA_TEKS, precision: 0 },
        grid: { color: WARNA_GRID },
        border: { display: false },
      },
    },
  };

  return (
    <div className="relative h-72 w-full">
      <Bar data={data} options={options} role="img" aria-label="Grafik jumlah latihan per hari" />
    </div>
  );
}
