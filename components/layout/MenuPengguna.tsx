"use client";

import { ChevronDown, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { getPenggunaSaatIni } from "@/lib/api";
import { LABEL_PAKET, type Pengguna } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DialogKeluar } from "./DialogKeluar";

function inisial(nama: string) {
  return nama
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((k) => k[0]?.toUpperCase())
    .join("");
}

function usePengguna() {
  const [pengguna, setPengguna] = useState<Pengguna | null>(null);
  useEffect(() => {
    let aktif = true;
    getPenggunaSaatIni()
      .then((p) => aktif && setPengguna(p))
      .catch(() => aktif && setPengguna(null));
    return () => {
      aktif = false;
    };
  }, []);
  return pengguna;
}

function Avatar({ pengguna }: { pengguna: Pengguna | null }) {
  return (
    <span className="flex size-9 items-center justify-center rounded-full bg-nada-700 text-sm font-bold text-white">
      {pengguna ? (
        inisial(pengguna.nama)
      ) : (
        <UserRound className="size-5" aria-hidden="true" />
      )}
    </span>
  );
}

function InfoPengguna({ pengguna }: { pengguna: Pengguna | null }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-semibold text-tinta">
        {pengguna?.nama ?? "Akun Saya"}
      </p>
      <p className="truncate text-xs text-redup">
        {pengguna?.email ?? "Data akun belum tersedia"}
      </p>
      {pengguna && (
        <Badge varian="nada" className="mt-1.5">
          {LABEL_PAKET[pengguna.statusPaket]}
        </Badge>
      )}
    </div>
  );
}

export function MenuPengguna() {
  const pengguna = usePengguna();
  const [terbuka, setTerbuka] = useState(false);
  const [konfirmasiKeluar, setKonfirmasiKeluar] = useState(false);
  const wadah = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!terbuka) return;
    function klikLuar(e: MouseEvent) {
      if (!wadah.current?.contains(e.target as Node)) setTerbuka(false);
    }
    function tombol(e: KeyboardEvent) {
      if (e.key === "Escape") setTerbuka(false);
    }
    document.addEventListener("mousedown", klikLuar);
    document.addEventListener("keydown", tombol);
    return () => {
      document.removeEventListener("mousedown", klikLuar);
      document.removeEventListener("keydown", tombol);
    };
  }, [terbuka]);

  return (
    <div ref={wadah} className="relative">
      <button
        type="button"
        onClick={() => setTerbuka((v) => !v)}
        aria-expanded={terbuka}
        aria-haspopup="menu"
        className="flex items-center gap-1.5 rounded-full p-0.5 pr-2 hover:bg-nada-50"
      >
        <Avatar pengguna={pengguna} />
        <ChevronDown
          className={cn(
            "size-4 text-redup transition-transform",
            terbuka && "rotate-180",
          )}
          aria-hidden="true"
        />
        <span className="sr-only">Menu akun</span>
      </button>

      {terbuka && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 rounded-2xl border border-garis bg-white p-2 shadow-xl"
        >
          <div className="border-b border-garis px-3 pt-2 pb-3">
            <InfoPengguna pengguna={pengguna} />
          </div>
          <Link
            role="menuitem"
            href="/profil"
            onClick={() => setTerbuka(false)}
            className="mt-1 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-tinta hover:bg-nada-50"
          >
            <UserRound className="size-4 text-redup" aria-hidden="true" />
            Profil
          </Link>
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              setTerbuka(false);
              setKonfirmasiKeluar(true);
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Keluar
          </button>
        </div>
      )}
      <DialogKeluar
        terbuka={konfirmasiKeluar}
        onTutup={() => setKonfirmasiKeluar(false)}
      />
    </div>
  );
}
