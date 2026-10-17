"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";

export type TautanNav = { href: string; label: string };

type Props = {
  tautan: TautanNav[];
  /** Elemen di sisi kanan (tombol masuk/daftar atau menu pengguna). */
  aksi?: ReactNode;
  /** Versi aksi untuk menu ponsel; bila kosong memakai `aksi`. */
  aksiPonsel?: ReactNode;
};

type PropsDaftar = {
  tautan: TautanNav[];
  ponsel?: boolean;
  onPilih?: () => void;
};

function DaftarTautan({
  tautan,
  ponsel,
  onPilih,
  pathname,
}: PropsDaftar & { pathname: string | null }) {
  const aktif = (href: string) =>
    pathname !== null &&
    !href.includes("#") &&
    (pathname === href || pathname.startsWith(`${href}/`));

  return (
    <ul className={ponsel ? "flex flex-col" : "hidden items-center gap-1 md:flex"}>
      {tautan.map((t) => (
        <li key={t.href}>
          <Link
            href={t.href}
            onClick={onPilih}
            aria-current={aktif(t.href) ? "page" : undefined}
            className={cn(
              "rounded-lg font-medium transition-colors",
              ponsel ? "block px-3 py-3 text-base" : "px-3 py-2 text-sm",
              aktif(t.href)
                ? "bg-nada-100 text-nada-800"
                : ponsel
                  ? "text-tinta hover:bg-nada-50"
                  : "text-redup hover:bg-nada-50 hover:text-nada-800",
            )}
          >
            {t.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function DaftarTautanAktif(props: PropsDaftar) {
  return <DaftarTautan {...props} pathname={usePathname()} />;
}

/**
 * Penanda tautan aktif membaca URL saat permintaan. Dengan Cache Components,
 * bagian itu dibungkus Suspense agar rute dinamis tetap dapat diprerender.
 */
function Tautan(props: PropsDaftar) {
  return (
    <Suspense fallback={<DaftarTautan {...props} pathname={null} />}>
      <DaftarTautanAktif {...props} />
    </Suspense>
  );
}

export function Navbar({ tautan, aksi, aksiPonsel }: Props) {
  const [terbuka, setTerbuka] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-garis/80 bg-krem/90 backdrop-blur">
      <nav
        aria-label="Navigasi utama"
        className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6"
      >
        <Logo href="/" ukuran={34} prioritas />

        <Tautan tautan={tautan} />

        <div className="hidden items-center gap-2 md:flex">{aksi}</div>

        <button
          type="button"
          onClick={() => setTerbuka((v) => !v)}
          aria-expanded={terbuka}
          aria-controls="menu-ponsel"
          aria-label={terbuka ? "Tutup menu" : "Buka menu"}
          className="flex size-10 items-center justify-center rounded-lg text-nada-800 hover:bg-nada-50 md:hidden"
        >
          {terbuka ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </nav>

      {terbuka && (
        <div
          id="menu-ponsel"
          className="border-t border-garis bg-krem px-4 pt-2 pb-4 md:hidden"
        >
          <Tautan tautan={tautan} ponsel onPilih={() => setTerbuka(false)} />
          <div
            className="mt-3 flex flex-col gap-2 border-t border-garis pt-3"
            onClick={() => setTerbuka(false)}
          >
            {aksiPonsel ?? aksi}
          </div>
        </div>
      )}
    </header>
  );
}
