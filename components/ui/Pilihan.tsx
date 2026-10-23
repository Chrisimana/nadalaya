import { ChevronDown } from "lucide-react";
import { useId, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

type Props = Omit<ComponentProps<"select">, "id"> & {
  label: string;
  labelTersembunyi?: boolean;
  galat?: string;
  id?: string;
  opsi: { nilai: string; label: string }[];
};

export function Pilihan({
  label,
  labelTersembunyi,
  galat,
  id,
  opsi,
  className,
  ...sisa
}: Props) {
  const idOtomatis = useId();
  const idKolom = id ?? idOtomatis;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={idKolom}
        className={cn("text-sm font-semibold text-tinta", labelTersembunyi && "sr-only")}
      >
        {label}
      </label>
      <div className="relative">
        <select
          {...sisa}
          id={idKolom}
          aria-invalid={galat ? true : undefined}
          aria-describedby={galat ? `${idKolom}-galat` : undefined}
          className={cn(
            "h-11 w-full appearance-none rounded-xl border bg-white pr-10 pl-4 text-base text-tinta",
            "outline-none focus:border-nada-500 focus:ring-3 focus:ring-nada-100",
            galat ? "border-red-400" : "border-garis",
          )}
        >
          {opsi.map((o) => (
            <option key={o.nilai} value={o.nilai}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-redup"
          aria-hidden="true"
        />
      </div>
      {galat && (
        <p id={`${idKolom}-galat`} className="text-sm text-red-600">
          {galat}
        </p>
      )}
    </div>
  );
}
