import { ChevronRight, Lock, Timer } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { LABEL_TINGKAT, type Materi } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Kartu satu materi. Materi premium bagi pengguna Gratis tampil dengan
 * ikon gembok (FR-07); hak akses tetap diperiksa server saat dibuka (FR-08).
 */
export function KartuMateri({ materi }: { materi: Materi }) {
  const terkunci = materi.isPremium && materi.terkunci;

  return (
    <Link
      href={`/latihan/${materi.id}`}
      className={cn(
        "group flex items-center gap-4 rounded-2xl border bg-white p-4 transition-all",
        "hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-16px_rgb(46_42_107/0.4)]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kuningan-400",
        terkunci ? "border-garis" : "border-garis hover:border-nada-300",
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge varian="netral">{LABEL_TINGKAT[materi.tingkat]}</Badge>
          {materi.isPremium && (
            <Badge varian="kuningan">
              {terkunci && <Lock className="size-3" aria-hidden="true" />}
              Premium
            </Badge>
          )}
        </div>
        <p
          className={cn(
            "font-semibold",
            terkunci ? "text-redup" : "text-tinta",
          )}
        >
          {materi.judul}
        </p>
        <p className="flex items-center gap-1.5 text-xs text-redup">
          <Timer className="size-3.5" aria-hidden="true" />
          {materi.tempo} BPM
        </p>
      </div>
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full transition-colors",
          terkunci
            ? "bg-kuningan-50 text-kuningan-600"
            : "bg-nada-50 text-nada-700 group-hover:bg-nada-700 group-hover:text-white",
        )}
      >
        {terkunci ? (
          <Lock className="size-4" aria-label="Terkunci, khusus Premium" />
        ) : (
          <ChevronRight className="size-5" aria-hidden="true" />
        )}
      </span>
    </Link>
  );
}
