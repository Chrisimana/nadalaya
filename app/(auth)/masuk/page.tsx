import type { Metadata } from "next";
import Link from "next/link";
import { FormMasuk } from "@/components/auth/FormMasuk";
import { KartuAuth } from "@/components/auth/KartuAuth";

export const metadata: Metadata = { title: "Masuk" };

export default function HalamanMasuk() {
  return (
    <KartuAuth
      judul="Selamat datang kembali"
      deskripsi="Masuk untuk melanjutkan latihan dan melihat skor terbaru Anda."
      kaki={
        <>
          Belum punya akun?{" "}
          <Link
            href="/daftar"
            className="font-semibold text-nada-700 underline-offset-4 hover:underline"
          >
            Daftar
          </Link>
        </>
      }
    >
      <FormMasuk />
    </KartuAuth>
  );
}
