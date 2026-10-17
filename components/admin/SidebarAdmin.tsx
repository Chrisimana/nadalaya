"use client";

import {
  BarChart3,
  LayoutDashboard,
  ListMusic,
  LogOut,
  Menu,
  ReceiptText,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";
import { DialogKeluar } from "@/components/layout/DialogKeluar";
import { Logo } from "@/components/Logo";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

const MENU: { href: string; label: string; ikon: LucideIcon }[] = [
  { href: "/admin", label: "Dashboard", ikon: LayoutDashboard },
  { href: "/admin/materi", label: "Materi", ikon: ListMusic },
  { href: "/admin/pengguna", label: "Pengguna", ikon: Users },
  { href: "/admin/statistik", label: "Statistik", ikon: BarChart3 },
  { href: "/admin/transaksi", label: "Transaksi", ikon: ReceiptText },
];

function aktif(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function DaftarMenu({
  pathname,
  onPilih,
}: {
  pathname: string | null;
  onPilih?: () => void;
}) {
  return (
    <ul className="flex flex-col gap-1">
      {MENU.map(({ href, label, ikon: Ikon }) => {
        const ya = aktif(pathname, href);
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onPilih}
              aria-current={ya ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                ya
                  ? "bg-nada-700 text-white"
                  : "text-redup hover:bg-nada-50 hover:text-nada-800",
              )}
            >
              <Ikon className="size-5" aria-hidden="true" />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function DaftarMenuAktif(props: { onPilih?: () => void }) {
  return <DaftarMenu pathname={usePathname()} {...props} />;
}

/** Penanda menu aktif membaca URL, sehingga dibungkus Suspense. */
function MenuAdmin(props: { onPilih?: () => void }) {
  return (
    <Suspense fallback={<DaftarMenu pathname={null} {...props} />}>
      <DaftarMenuAktif {...props} />
    </Suspense>
  );
}

function TombolKeluar({ onKlik }: { onKlik: () => void }) {
  return (
    <button
      type="button"
      onClick={onKlik}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50"
    >
      <LogOut className="size-5" aria-hidden="true" />
      Keluar
    </button>
  );
}

function KepalaSidebar() {
  return (
    <div className="flex items-center gap-2">
      <Logo href="/admin" ukuran={30} kelasTeks="text-lg" />
      <Badge varian="kuningan">Admin</Badge>
    </div>
  );
}

/**
 * Navigasi area admin: sidebar tetap di desktop, bilah atas dengan menu
 * yang dapat dibuka di ponsel.
 */
export function SidebarAdmin() {
  const [terbuka, setTerbuka] = useState(false);
  const [konfirmasiKeluar, setKonfirmasiKeluar] = useState(false);

  return (
    <>
      {/* Desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-garis bg-white px-4 py-5 lg:flex">
        <KepalaSidebar />
        <nav aria-label="Menu admin" className="mt-8 flex-1">
          <MenuAdmin />
        </nav>
        <div className="border-t border-garis pt-4">
          <TombolKeluar onKlik={() => setKonfirmasiKeluar(true)} />
        </div>
      </aside>

      {/* Ponsel dan tablet */}
      <header className="sticky top-0 z-40 border-b border-garis bg-white/95 backdrop-blur lg:hidden">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <KepalaSidebar />
          <button
            type="button"
            onClick={() => setTerbuka((v) => !v)}
            aria-expanded={terbuka}
            aria-controls="menu-admin-ponsel"
            aria-label={terbuka ? "Tutup menu" : "Buka menu"}
            className="flex size-10 items-center justify-center rounded-lg text-nada-800 hover:bg-nada-50"
          >
            {terbuka ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
        {terbuka && (
          <nav
            id="menu-admin-ponsel"
            aria-label="Menu admin"
            className="border-t border-garis px-4 pt-3 pb-4"
          >
            <MenuAdmin onPilih={() => setTerbuka(false)} />
            <div className="mt-3 border-t border-garis pt-3">
              <TombolKeluar
                onKlik={() => {
                  setTerbuka(false);
                  setKonfirmasiKeluar(true);
                }}
              />
            </div>
          </nav>
        )}
      </header>

      <DialogKeluar
        terbuka={konfirmasiKeluar}
        onTutup={() => setKonfirmasiKeluar(false)}
      />
    </>
  );
}
