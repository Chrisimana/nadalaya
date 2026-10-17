import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FormMasuk, type PemberitahuanMasuk } from "@/components/auth/FormMasuk";
import { KartuAuth } from "@/components/auth/KartuAuth";

export const metadata: Metadata = { title: "Masuk" };

type ParamCari = Record<string, string | string[] | undefined>;

/** Pesan dari /auth/konfirmasi dan proxy.ts yang dikirim lewat URL. */
function pemberitahuan(sp: ParamCari): PemberitahuanMasuk {
  if (sp.galat === "nonaktif") return "nonaktif";
  if (sp.verifikasi === "berhasil") return "verifikasi_berhasil";
  if (sp.verifikasi === "gagal") return "verifikasi_gagal";
  return null;
}

export default function HalamanMasuk({ searchParams }: PageProps<"/masuk">) {
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
      <Suspense fallback={<FormMasuk />}>
        {searchParams.then((sp) => (
          <FormMasuk
            pemberitahuan={pemberitahuan(sp)}
            lanjut={typeof sp.lanjut === "string" ? sp.lanjut : null}
          />
        ))}
      </Suspense>
    </KartuAuth>
  );
}
