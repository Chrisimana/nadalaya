"use client";

import { TriangleAlert } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";

type Props = {
  terbuka: boolean;
  judul: string;
  children?: ReactNode;
  labelKonfirmasi: string;
  labelBatal?: string;
  /** "bahaya" untuk aksi yang tidak dapat dibatalkan. */
  varian?: "bahaya" | "utama";
  memuat?: boolean;
  onKonfirmasi: () => void;
  onBatal: () => void;
};

/**
 * Dialog konfirmasi untuk aksi berisiko (hapus, nonaktifkan, keluar).
 * Memakai elemen <dialog> bawaan agar fokus terkunci di dalam dialog dan
 * tombol Esc menutupnya.
 */
export function DialogKonfirmasi({
  terbuka,
  judul,
  children,
  labelKonfirmasi,
  labelBatal = "Batal",
  varian = "bahaya",
  memuat,
  onKonfirmasi,
  onBatal,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const idJudul = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (terbuka && !d.open) d.showModal();
    if (!terbuka && d.open) d.close();
  }, [terbuka]);

  function batal() {
    if (!memuat) onBatal();
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={idJudul}
      onCancel={(e) => {
        e.preventDefault();
        batal();
      }}
      onClick={(e) => {
        // Klik di luar kotak dialog (pada latar) menutup dialog.
        if (e.target === ref.current) batal();
      }}
      className="fixed inset-0 m-auto h-fit w-[calc(100%-2rem)] max-w-md rounded-2xl border border-garis bg-white p-0 text-tinta shadow-2xl backdrop:bg-nada-950/40 backdrop:backdrop-blur-sm"
    >
      <div className="flex flex-col gap-5 p-6">
        <div className="flex gap-4">
          {varian === "bahaya" && (
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
              <TriangleAlert className="size-5" aria-hidden="true" />
            </span>
          )}
          <div className="flex flex-col gap-2">
            <h2 id={idJudul} className="text-lg font-bold text-tinta">
              {judul}
            </h2>
            {children && (
              <div className="text-sm leading-relaxed text-redup">{children}</div>
            )}
          </div>
        </div>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button varian="garis" onClick={batal} disabled={memuat}>
            {labelBatal}
          </Button>
          <Button
            varian={varian === "bahaya" ? "bahaya" : "utama"}
            onClick={onKonfirmasi}
            memuat={memuat}
          >
            {labelKonfirmasi}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
