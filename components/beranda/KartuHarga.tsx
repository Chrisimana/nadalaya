import { Check } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatRupiah, type InfoPaket } from "@/lib/paket";
import { cn } from "@/lib/utils";

export function KartuHarga({ paket }: { paket: InfoPaket }) {
  const unggulan = paket.unggulan;
  return (
    <article
      className={cn(
        "relative flex flex-col rounded-2xl border p-6",
        unggulan
          ? "border-nada-700 bg-nada-800 text-white shadow-[0_24px_50px_-20px_rgb(46_42_107/0.6)]"
          : "border-garis bg-white",
      )}
    >
      {unggulan && (
        <Badge varian="kuningan" className="absolute -top-3 left-6">
          Paling diminati
        </Badge>
      )}
      <h3
        className={cn(
          "text-lg font-bold",
          unggulan ? "text-white" : "text-tinta",
        )}
      >
        {paket.nama}
      </h3>
      <p
        className={cn(
          "mt-1 text-sm",
          unggulan ? "text-nada-200" : "text-redup",
        )}
      >
        {paket.ringkasan}
      </p>
      <p className="mt-5 flex items-baseline gap-1">
        <span className="font-serif text-3xl font-semibold">
          {paket.harga === 0 ? "Rp0" : formatRupiah(paket.harga)}
        </span>
        <span
          className={cn(
            "text-sm",
            unggulan ? "text-nada-200" : "text-redup",
          )}
        >
          / {paket.satuan}
        </span>
      </p>
      {paket.catatan && (
        <p
          className={cn(
            "mt-1 text-xs font-medium",
            unggulan ? "text-kuningan-300" : "text-kuningan-600",
          )}
        >
          {paket.catatan}
        </p>
      )}
      <ul className="mt-5 flex flex-1 flex-col gap-2.5 text-sm">
        {paket.fitur.map((f) => (
          <li key={f} className="flex gap-2">
            <Check
              className={cn(
                "mt-0.5 size-4 shrink-0",
                unggulan ? "text-kuningan-300" : "text-nada-600",
              )}
              aria-hidden="true"
            />
            {f}
          </li>
        ))}
      </ul>
      <Button
        href="/daftar"
        varian={unggulan ? "aksen" : "garis"}
        lebarPenuh
        className="mt-6"
      >
        {paket.harga === 0 ? "Mulai Gratis" : `Pilih ${paket.nama}`}
      </Button>
    </article>
  );
}
