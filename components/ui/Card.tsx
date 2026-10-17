import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...sisa }: ComponentProps<"div">) {
  return (
    <div
      {...sisa}
      className={cn(
        "rounded-2xl border border-garis bg-white p-5 shadow-[0_1px_2px_rgb(31_35_51/0.04)] sm:p-6",
        className,
      )}
    />
  );
}

export function JudulKartu({ className, ...sisa }: ComponentProps<"h2">) {
  return (
    <h2
      {...sisa}
      className={cn("text-base font-bold text-tinta", className)}
    />
  );
}
