import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

/** Judul halaman di area aplikasi (pengguna dan admin). */
export function KepalaAplikasi({
  judul,
  deskripsi,
  aksi,
  kembali,
}: {
  judul: string;
  deskripsi?: ReactNode;
  /** Tombol di sisi kanan judul. */
  aksi?: ReactNode;
  /** Tautan kembali di atas judul. */
  kembali?: { href: string; label: string };
}) {
  return (
    <header className="flex flex-col gap-4">
      {kembali && (
        <Link
          href={kembali.href}
          className="inline-flex items-center gap-1.5 self-start rounded-lg text-sm font-semibold text-nada-700 hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {kembali.label}
        </Link>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-nada-900 sm:text-4xl">
            {judul}
          </h1>
          {deskripsi && <p className="mt-2 max-w-2xl text-redup">{deskripsi}</p>}
        </div>
        {aksi && <div className="flex shrink-0 flex-wrap gap-3">{aksi}</div>}
      </div>
    </header>
  );
}
