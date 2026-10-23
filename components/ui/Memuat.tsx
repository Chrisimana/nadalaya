import { RotateCw } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";

export function Memuat({
  teks = "Memuat…",
  className,
}: {
  teks?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex items-center justify-center gap-2.5 py-12 text-sm text-redup",
        className,
      )}
    >
      <Spinner className="size-5 text-nada-500" />
      {teks}
    </div>
  );
}

export function Kerangka({
  jumlah = 3,
  tinggi = "h-20",
  className,
  label = "Memuat data",
}: {
  jumlah?: number;
  tinggi?: string;
  className?: string;
  label?: string;
}) {
  return (
    <div
      aria-busy="true"
      aria-label={label}
      className={cn("flex flex-col gap-3", className)}
    >
      {Array.from({ length: jumlah }, (_, i) => (
        <div
          key={i}
          className={cn(
            "animate-pulse rounded-2xl border border-garis bg-white",
            tinggi,
          )}
        />
      ))}
    </div>
  );
}

export function GagalMuat({
  judul,
  pesan,
  onMuatUlang,
}: {
  judul: string;
  pesan: string;
  onMuatUlang: () => void;
}) {
  return (
    <Alert
      varian="galat"
      judul={judul}
      aksi={
        <Button
          varian="garis"
          ukuran="sm"
          ikon={<RotateCw className="size-4" aria-hidden="true" />}
          onClick={onMuatUlang}
        >
          Muat Ulang
        </Button>
      }
    >
      {pesan}
    </Alert>
  );
}
