import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";

export function KartuAuth({
  judul,
  deskripsi,
  children,
  kaki,
}: {
  judul: string;
  deskripsi?: string;
  children: ReactNode;
  kaki?: ReactNode;
}) {
  return (
    <div className="w-full max-w-md">
      <div className="rounded-3xl border border-garis bg-white p-6 shadow-[0_24px_60px_-28px_rgb(46_42_107/0.35)] sm:p-8">
        <div className="mb-5 flex justify-center">
          <Logo href="/" ukuran={40} denganTeks={false} />
        </div>
        <h1 className="font-serif text-3xl font-semibold text-nada-900">
          {judul}
        </h1>
        {deskripsi && (
          <p className="mt-2 text-sm leading-relaxed text-redup">{deskripsi}</p>
        )}
        <div className="mt-7">{children}</div>
      </div>
      {kaki && (
        <div className="mt-6 text-center text-sm text-redup">{kaki}</div>
      )}
    </div>
  );
}
