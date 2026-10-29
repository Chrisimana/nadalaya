import { CircleCheck } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { KartuAuth } from "@/components/auth/KartuAuth";
import { Button } from "@/components/ui/Button";
import { jalurInternal } from "@/lib/keamanan";

export const metadata: Metadata = { title: "Email Terverifikasi" };

function IsiTerverifikasi({ lanjut, perluMasuk }: { lanjut: string; perluMasuk: boolean }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
        <CircleCheck className="size-8" aria-hidden="true" />
      </span>
      <p className="text-sm leading-relaxed text-redup">
        {perluMasuk
          ? "Akun Nadalaya Anda sudah aktif. Silakan masuk dengan email dan kata sandi yang Anda daftarkan."
          : "Akun Nadalaya Anda sudah aktif dan siap dipakai untuk berlatih."}
      </p>
      {perluMasuk ? (
        <Button href="/masuk" ukuran="lg" lebarPenuh>
          Ke Halaman Masuk
        </Button>
      ) : (
        <Button href={lanjut} ukuran="lg" lebarPenuh>
          Masuk ke Dashboard
        </Button>
      )}
    </div>
  );
}

export default function HalamanTerverifikasi({ searchParams }: PageProps<"/auth/terverifikasi">) {
  return (
    <KartuAuth judul="Email Anda berhasil diverifikasi">
      <Suspense fallback={<IsiTerverifikasi lanjut="/dashboard" perluMasuk={false} />}>
        {searchParams.then((sp) => (
          <IsiTerverifikasi
            lanjut={jalurInternal(typeof sp.lanjut === "string" ? sp.lanjut : null)}
            perluMasuk={sp.masuk === "1"}
          />
        ))}
      </Suspense>
    </KartuAuth>
  );
}
