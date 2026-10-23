import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  ikon: LucideIcon;
  judul: string;
  deskripsi?: ReactNode;
  aksi?: ReactNode;
  ringkas?: boolean;
  className?: string;
};

export function EmptyState({
  ikon: Ikon,
  judul,
  deskripsi,
  aksi,
  ringkas,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-nada-200 bg-nada-50/40 text-center",
        ringkas ? "gap-2 px-4 py-6" : "gap-3 px-6 py-12",
        className,
      )}
    >
      <span
        className={cn(
          "flex items-center justify-center rounded-full bg-white text-nada-500 ring-1 ring-nada-100",
          ringkas ? "size-10" : "size-14",
        )}
      >
        <Ikon className={ringkas ? "size-5" : "size-7"} aria-hidden="true" />
      </span>
      <p
        className={cn(
          "font-semibold text-tinta",
          ringkas ? "text-sm" : "text-base",
        )}
      >
        {judul}
      </p>
      {deskripsi && (
        <p className="max-w-sm text-sm leading-relaxed text-redup">
          {deskripsi}
        </p>
      )}
      {aksi && (
        <div className="mt-1 flex flex-wrap justify-center gap-2">{aksi}</div>
      )}
    </div>
  );
}
