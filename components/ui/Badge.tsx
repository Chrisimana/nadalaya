import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Varian = "netral" | "nada" | "kuningan" | "sukses" | "galat";

const gaya: Record<Varian, string> = {
  netral: "bg-slate-100 text-slate-700",
  nada: "bg-nada-100 text-nada-800",
  kuningan: "bg-kuningan-100 text-kuningan-700",
  sukses: "bg-emerald-100 text-emerald-800",
  galat: "bg-red-100 text-red-800",
};

export function Badge({
  varian = "netral",
  children,
  className,
}: {
  varian?: Varian;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        gaya[varian],
        className,
      )}
    >
      {children}
    </span>
  );
}
