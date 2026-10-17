import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";

/** Kartu angka ringkasan untuk halaman admin. */
export function KartuStat({
  ikon: Ikon,
  label,
  nilai,
  keterangan,
}: {
  ikon: LucideIcon;
  label: string;
  nilai: string | number;
  keterangan?: string;
}) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-lg bg-nada-50 text-nada-600">
          <Ikon className="size-5" aria-hidden="true" />
        </span>
        <p className="text-sm font-semibold text-redup">{label}</p>
      </div>
      <p className="truncate font-serif text-3xl font-semibold text-nada-900 tabular-nums">
        {nilai}
      </p>
      {keterangan && <p className="text-xs text-redup">{keterangan}</p>}
    </Card>
  );
}
