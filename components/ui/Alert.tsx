import {
  CircleAlert,
  CircleCheck,
  Info,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Varian = "info" | "sukses" | "peringatan" | "galat";

const gaya: Record<Varian, { kotak: string; ikon: string; Ikon: LucideIcon }> =
  {
    info: {
      kotak: "border-nada-200 bg-nada-50 text-nada-900",
      ikon: "text-nada-600",
      Ikon: Info,
    },
    sukses: {
      kotak: "border-emerald-200 bg-emerald-50 text-emerald-900",
      ikon: "text-emerald-600",
      Ikon: CircleCheck,
    },
    peringatan: {
      kotak: "border-kuningan-200 bg-kuningan-50 text-kuningan-700",
      ikon: "text-kuningan-500",
      Ikon: TriangleAlert,
    },
    galat: {
      kotak: "border-red-200 bg-red-50 text-red-900",
      ikon: "text-red-600",
      Ikon: CircleAlert,
    },
  };

type Props = {
  varian?: Varian;
  judul?: string;
  children?: ReactNode;
  aksi?: ReactNode;
  className?: string;
};

export function Alert({
  varian = "info",
  judul,
  children,
  aksi,
  className,
}: Props) {
  const { kotak, ikon, Ikon } = gaya[varian];
  return (
    <div
      role={varian === "galat" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-xl border p-4 text-sm", kotak, className)}
    >
      <Ikon className={cn("mt-0.5 size-5 shrink-0", ikon)} aria-hidden="true" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {judul && <p className="font-semibold">{judul}</p>}
        {children && <div className="leading-relaxed">{children}</div>}
        {aksi && <div className="mt-2 flex flex-wrap gap-2">{aksi}</div>}
      </div>
    </div>
  );
}
