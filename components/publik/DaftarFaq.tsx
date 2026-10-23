import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

export type ItemFaq = { tanya: string; jawab: ReactNode };

export function DaftarFaq({ daftar }: { daftar: ItemFaq[] }) {
  return (
    <div className="divide-y divide-garis rounded-2xl border border-garis bg-white">
      {daftar.map(({ tanya, jawab }) => (
        <details key={tanya} className="group px-5 py-1">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold text-tinta [&::-webkit-details-marker]:hidden">
            {tanya}
            <ChevronDown
              className="size-5 shrink-0 text-redup transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <div className="pb-5 text-sm leading-relaxed text-redup">{jawab}</div>
        </details>
      ))}
    </div>
  );
}
