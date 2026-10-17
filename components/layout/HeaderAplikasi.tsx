"use client";

import {
  Crown,
  History,
  LayoutDashboard,
  ListMusic,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";
import { MenuPengguna } from "./MenuPengguna";

type MenuAplikasi = { href: string; label: string; ikon: LucideIcon };

const MENU: MenuAplikasi[] = [
  { href: "/dashboard", label: "Dashboard", ikon: LayoutDashboard },
  { href: "/materi", label: "Materi", ikon: ListMusic },
  { href: "/riwayat", label: "Riwayat", ikon: History },
  { href: "/progres", label: "Progres", ikon: TrendingUp },
  { href: "/langganan", label: "Langganan", ikon: Crown },
];

/** Halaman latihan termasuk bagian menu Materi. */
function aktif(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/materi" && pathname.startsWith("/latihan")) return true;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function DaftarMenu({
  pathname,
  bawah,
}: {
  pathname: string | null;
  bawah?: boolean;
}) {
  if (bawah) {
    return (
      <ul className="grid grid-cols-5">
        {MENU.map(({ href, label, ikon: Ikon }) => {
          const ya = aktif(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={ya ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 text-[11px] font-semibold",
                  ya ? "text-nada-700" : "text-redup",
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-11 items-center justify-center rounded-full transition-colors",
                    ya && "bg-nada-100",
                  )}
                >
                  <Ikon className="size-5" aria-hidden="true" />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <ul className="flex items-center gap-1">
      {MENU.map(({ href, label, ikon: Ikon }) => {
        const ya = aktif(pathname, href);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={ya ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                ya
                  ? "bg-nada-100 text-nada-800"
                  : "text-redup hover:bg-nada-50 hover:text-nada-800",
              )}
            >
              <Ikon className="size-4" aria-hidden="true" />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function DaftarMenuAktif({ bawah }: { bawah?: boolean }) {
  return <DaftarMenu pathname={usePathname()} bawah={bawah} />;
}

/** Menu aplikasi; penanda aktif membaca URL sehingga dibungkus Suspense. */
function Menu({ bawah }: { bawah?: boolean }) {
  return (
    <Suspense fallback={<DaftarMenu pathname={null} bawah={bawah} />}>
      <DaftarMenuAktif bawah={bawah} />
    </Suspense>
  );
}

/**
 * Header aplikasi untuk halaman pengguna yang sudah masuk. Di desktop menu
 * tampil di header; di ponsel menu pindah ke bilah bawah yang ringkas.
 */
export function HeaderAplikasi() {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-garis bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo href="/dashboard" ukuran={32} prioritas />
          <nav aria-label="Menu aplikasi" className="hidden md:block">
            <Menu />
          </nav>
          <MenuPengguna />
        </div>
      </header>

      <nav
        aria-label="Menu aplikasi"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-garis bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <Menu bawah />
      </nav>
    </>
  );
}
