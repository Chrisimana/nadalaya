import type { Metadata } from "next";
import Link from "next/link";
import { FormLupaSandi } from "@/components/auth/FormLupaSandi";
import { KartuAuth } from "@/components/auth/KartuAuth";

export const metadata: Metadata = { title: "Lupa Kata Sandi" };

export default function HalamanLupaKataSandi() {
  return (
    <KartuAuth
      judul="Lupa kata sandi"
      deskripsi="Masukkan email akun Anda. Kami akan mengirim tautan untuk membuat kata sandi baru."
      kaki={
        <>
          Ingat kata sandi Anda?{" "}
          <Link
            href="/masuk"
            className="font-semibold text-nada-700 underline-offset-4 hover:underline"
          >
            Masuk
          </Link>
        </>
      }
    >
      <FormLupaSandi />
    </KartuAuth>
  );
}
