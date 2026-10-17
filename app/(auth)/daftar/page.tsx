import type { Metadata } from "next";
import Link from "next/link";
import { FormDaftar } from "@/components/auth/FormDaftar";
import { KartuAuth } from "@/components/auth/KartuAuth";

export const metadata: Metadata = { title: "Daftar Akun" };

export default function HalamanDaftar() {
  return (
    <KartuAuth
      judul="Buat akun Nadalaya"
      deskripsi="Daftar gratis dan mulai latihan solfeggio pertama Anda dalam beberapa menit."
      kaki={
        <>
          Sudah punya akun?{" "}
          <Link
            href="/masuk"
            className="font-semibold text-nada-700 underline-offset-4 hover:underline"
          >
            Masuk
          </Link>
        </>
      }
    >
      <FormDaftar />
    </KartuAuth>
  );
}
