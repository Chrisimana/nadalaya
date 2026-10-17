import { Search } from "lucide-react";
import { useId } from "react";
import { cn } from "@/lib/utils";

/** Kolom pencarian dengan ikon kaca pembesar dan label tersembunyi. */
export function KolomCari({
  label,
  nilai,
  onUbah,
  placeholder,
  className,
}: {
  label: string;
  nilai: string;
  onUbah: (nilai: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn("relative", className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search
        className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-redup"
        aria-hidden="true"
      />
      <input
        id={id}
        type="search"
        value={nilai}
        onChange={(e) => onUbah(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-garis bg-white pr-4 pl-10 text-base text-tinta outline-none placeholder:text-redup/60 focus:border-nada-500 focus:ring-3 focus:ring-nada-100"
      />
    </div>
  );
}
