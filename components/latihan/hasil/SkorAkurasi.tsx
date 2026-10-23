import { CircleAlert, CircleCheck, TriangleAlert, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Kategori = { label: string; ikon: LucideIcon; kelas: string; saran: string };

function kategori(skor: number): Kategori {
  if (skor >= 80) {
    return {
      label: "Sangat baik",
      ikon: CircleCheck,
      kelas: "bg-emerald-50 text-emerald-800",
      saran: "Nada Anda sudah tepat. Coba materi dengan tingkat lebih tinggi.",
    };
  }
  if (skor >= 50) {
    return {
      label: "Cukup baik",
      ikon: TriangleAlert,
      kelas: "bg-kuningan-50 text-kuningan-700",
      saran: "Perhatikan nada yang meleset di bawah, lalu ulangi latihan.",
    };
  }
  return {
    label: "Perlu latihan lagi",
    ikon: CircleAlert,
    kelas: "bg-red-50 text-red-800",
    saran: "Dengarkan acuan beberapa kali sebelum merekam ulang.",
  };
}

export function SkorAkurasi({ skor }: { skor: number }) {
  const nilai = Math.round(Math.min(100, Math.max(0, skor)));
  const { label, ikon: Ikon, kelas, saran } = kategori(nilai);
  const keliling = 2 * Math.PI * 52;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-7">
      <div className="relative size-36 shrink-0">
        <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden="true">
          <circle cx="60" cy="60" r="52" fill="none" strokeWidth="10" className="stroke-nada-100" />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            className="stroke-nada-600 transition-[stroke-dashoffset] duration-700"
            strokeDasharray={keliling}
            strokeDashoffset={keliling * (1 - nilai / 100)}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-serif text-5xl font-semibold text-tinta tabular-nums">
            {nilai}
          </span>
          <span className="text-xs font-semibold text-redup">dari 100</span>
        </div>
      </div>
      <div className="flex flex-col items-center gap-2 text-center sm:items-start sm:text-left">
        <p className="text-sm font-semibold text-redup">Skor akurasi nada</p>
        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold", kelas)}>
          <Ikon className="size-4" aria-hidden="true" />
          {label}
        </span>
        <p className="max-w-xs text-sm text-redup">{saran}</p>
      </div>
    </div>
  );
}
