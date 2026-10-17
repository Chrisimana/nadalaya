import { cn } from "@/lib/utils";

const JUMLAH_BATANG = 28;

/** Indikator level suara berbentuk batang (UC-11 langkah 1.2). */
export function IndikatorLevel({
  level,
  aktif,
}: {
  /** Level 0–1. */
  level: number;
  aktif: boolean;
}) {
  const menyala = Math.round(level * JUMLAH_BATANG);
  return (
    <div
      role="meter"
      aria-label="Level suara"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(level * 100)}
      className="flex h-12 items-end gap-[3px]"
    >
      {Array.from({ length: JUMLAH_BATANG }, (_, i) => {
        const nyala = aktif && i < menyala;
        const posisi = i / JUMLAH_BATANG;
        return (
          <span
            key={i}
            className={cn(
              "w-full rounded-full transition-[background-color] duration-75",
              !nyala
                ? "bg-nada-100"
                : posisi > 0.85
                  ? "bg-red-500"
                  : posisi > 0.6
                    ? "bg-kuningan-400"
                    : "bg-emerald-500",
            )}
            style={{ height: `${30 + posisi * 70}%` }}
          />
        );
      })}
    </div>
  );
}
