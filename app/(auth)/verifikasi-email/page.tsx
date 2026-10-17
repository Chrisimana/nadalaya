import type { Metadata } from "next";
import { Suspense } from "react";
import { InfoVerifikasiEmail } from "@/components/auth/InfoVerifikasiEmail";
import { KartuAuth } from "@/components/auth/KartuAuth";

export const metadata: Metadata = { title: "Verifikasi Email" };

export default function HalamanVerifikasiEmail({
  searchParams,
}: PageProps<"/verifikasi-email">) {
  return (
    <KartuAuth judul="Cek email Anda untuk memverifikasi akun">
      <Suspense fallback={<InfoVerifikasiEmail email={null} />}>
        {searchParams.then((sp) => (
          <InfoVerifikasiEmail
            email={typeof sp.email === "string" ? sp.email : null}
          />
        ))}
      </Suspense>
    </KartuAuth>
  );
}
