import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./Spinner";

type Varian = "utama" | "aksen" | "garis" | "hantu" | "bahaya";
type Ukuran = "sm" | "md" | "lg";

const gayaVarian: Record<Varian, string> = {
  utama:
    "bg-nada-700 text-white hover:bg-nada-800 active:bg-nada-900 disabled:bg-nada-300",
  aksen:
    "bg-kuningan-400 text-nada-950 hover:bg-kuningan-300 active:bg-kuningan-500 disabled:bg-kuningan-200",
  garis:
    "border border-nada-200 bg-white text-nada-700 hover:border-nada-300 hover:bg-nada-50 disabled:text-nada-300",
  hantu: "text-nada-700 hover:bg-nada-50 disabled:text-nada-300",
  bahaya:
    "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 disabled:bg-red-300",
};

const gayaUkuran: Record<Ukuran, string> = {
  sm: "h-9 gap-1.5 px-3 text-sm",
  md: "h-11 gap-2 px-5 text-sm",
  lg: "h-13 gap-2 px-7 text-base",
};

type PropsDasar = {
  varian?: Varian;
  ukuran?: Ukuran;
  lebarPenuh?: boolean;
  ikon?: ReactNode;
  className?: string;
  children?: ReactNode;
};

type PropsTombol = PropsDasar &
  Omit<ComponentProps<"button">, keyof PropsDasar> & {
    href?: undefined;
    memuat?: boolean;
  };

type PropsTautan = PropsDasar &
  Omit<ComponentProps<typeof Link>, keyof PropsDasar> & {
    href: ComponentProps<typeof Link>["href"];
  };

function kelasTombol({
  varian = "utama",
  ukuran = "md",
  lebarPenuh,
  className,
}: PropsDasar) {
  return cn(
    "inline-flex shrink-0 items-center justify-center rounded-xl font-semibold whitespace-nowrap transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kuningan-400",
    "disabled:cursor-not-allowed",
    gayaVarian[varian],
    gayaUkuran[ukuran],
    lebarPenuh && "w-full",
    className,
  );
}

export function Button(props: PropsTombol | PropsTautan) {
  if (props.href !== undefined) {
    const { varian, ukuran, lebarPenuh, ikon, className, children, ...sisa } =
      props;
    return (
      <Link
        {...sisa}
        className={kelasTombol({ varian, ukuran, lebarPenuh, className })}
      >
        {ikon}
        {children}
      </Link>
    );
  }

  const {
    varian,
    ukuran,
    lebarPenuh,
    ikon,
    className,
    children,
    memuat,
    disabled,
    type = "button",
    ...sisa
  } = props;
  return (
    <button
      {...sisa}
      type={type}
      disabled={disabled || memuat}
      aria-busy={memuat || undefined}
      className={kelasTombol({ varian, ukuran, lebarPenuh, className })}
    >
      {memuat ? <Spinner /> : ikon}
      {children}
    </button>
  );
}
