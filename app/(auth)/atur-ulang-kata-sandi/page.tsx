import type { Metadata } from "next";
import { Suspense } from "react";
import { FormAturUlangSandi } from "@/components/auth/FormAturUlangSandi";
import { KartuAuth } from "@/components/auth/KartuAuth";

export const metadata: Metadata = { title: "Atur Ulang Kata Sandi" };

// Supabase mengarahkan ke sini dengan `error_code=otp_expired` bila tautan
// sudah tidak berlaku; `galat=kedaluwarsa` dipakai untuk pengalihan internal.
function tautanKedaluwarsa(sp: Record<string, string | string[] | undefined>) {
  return sp.error_code === "otp_expired" || sp.galat === "kedaluwarsa";
}

export default function HalamanAturUlangKataSandi({
  searchParams,
}: PageProps<"/atur-ulang-kata-sandi">) {
  return (
    <KartuAuth
      judul="Atur ulang kata sandi"
      deskripsi="Buat kata sandi baru untuk akun Nadalaya Anda."
    >
      <Suspense fallback={<FormAturUlangSandi />}>
        {searchParams.then((sp) => (
          <FormAturUlangSandi kedaluwarsa={tautanKedaluwarsa(sp)} />
        ))}
      </Suspense>
    </KartuAuth>
  );
}
