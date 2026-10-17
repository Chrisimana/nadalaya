"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

type Props = Omit<ComponentProps<"input">, "id"> & {
  label: string;
  galat?: string;
  petunjuk?: string;
  id?: string;
};

/**
 * Kolom isian berlabel dengan pesan galat per kolom.
 * Untuk `type="password"` tersedia tombol tampilkan/sembunyikan.
 */
export function Input({
  label,
  galat,
  petunjuk,
  id,
  type = "text",
  className,
  ...sisa
}: Props) {
  const idOtomatis = useId();
  const idKolom = id ?? idOtomatis;
  const idKeterangan = `${idKolom}-keterangan`;
  const [tampilkanSandi, setTampilkanSandi] = useState(false);
  const adalahSandi = type === "password";
  const keterangan = galat ?? petunjuk;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={idKolom} className="text-sm font-semibold text-tinta">
        {label}
      </label>
      <div className="relative">
        <input
          {...sisa}
          id={idKolom}
          type={adalahSandi && tampilkanSandi ? "text" : type}
          aria-invalid={galat ? true : undefined}
          aria-describedby={keterangan ? idKeterangan : undefined}
          className={cn(
            "h-11 w-full rounded-xl border bg-white px-4 text-base text-tinta placeholder:text-redup/60",
            "transition-colors outline-none focus:border-nada-500 focus:ring-3 focus:ring-nada-100",
            galat
              ? "border-red-400 focus:border-red-500 focus:ring-red-100"
              : "border-garis",
            adalahSandi && "pr-12",
          )}
        />
        {adalahSandi && (
          <button
            type="button"
            onClick={() => setTampilkanSandi((v) => !v)}
            aria-label={
              tampilkanSandi ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
            }
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-redup hover:text-nada-700"
          >
            {tampilkanSandi ? (
              <EyeOff className="size-5" />
            ) : (
              <Eye className="size-5" />
            )}
          </button>
        )}
      </div>
      {keterangan && (
        <p
          id={idKeterangan}
          className={cn("text-sm", galat ? "text-red-600" : "text-redup")}
        >
          {keterangan}
        </p>
      )}
    </div>
  );
}
