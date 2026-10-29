import { MailWarning } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FormKirimUlangVerifikasi } from "@/components/auth/FormKirimUlangVerifikasi";
import { KartuAuth } from "@/components/auth/KartuAuth";

export const metadata: Metadata = { title: "Verifikasi Gagal" };

const PENJELASAN = {
  kedaluwarsa: "Tautan verifikasi sudah kedaluwarsa atau sudah pernah dipakai.",
  tidak_valid: "Tautan verifikasi tidak lengkap atau tidak valid, misalnya karena terpotong saat disalin.",
};

function Penjelasan({ alasan }: { alasan: keyof typeof PENJELASAN }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-kuningan-50 text-kuningan-600 ring-1 ring-kuningan-200">
        <MailWarning className="size-8" aria-hidden="true" />
      </span>
      <p className="text-sm leading-relaxed text-redup">
        {PENJELASAN[alasan]} Masukkan email yang Anda daftarkan untuk menerima tautan verifikasi baru. Jika
        akun Anda sudah pernah diverifikasi, langsung masuk saja.
      </p>
    </div>
  );
}

export default function HalamanVerifikasiGagal({ searchParams }: PageProps<"/auth/verifikasi-gagal">) {
  return (
    <KartuAuth
      judul="Tautan verifikasi tidak berlaku"
      kaki={
        <>
          Sudah terverifikasi?{" "}
          <Link href="/masuk" className="font-semibold text-nada-700 underline-offset-4 hover:underline">
            Masuk
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <Suspense fallback={<Penjelasan alasan="tidak_valid" />}>
          {searchParams.then((sp) => (
            <Penjelasan alasan={sp.alasan === "kedaluwarsa" ? "kedaluwarsa" : "tidak_valid"} />
          ))}
        </Suspense>
        <FormKirimUlangVerifikasi />
      </div>
    </KartuAuth>
  );
}
