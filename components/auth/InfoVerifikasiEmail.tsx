"use client";

import { MailCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { AlertServer, keGalatServer, type GalatServer } from "@/components/ui/AlertServer";
import { Button } from "@/components/ui/Button";
import { kirimUlangVerifikasi } from "@/lib/api";

const JEDA_KIRIM_ULANG = 60;

/** Informasi setelah mendaftar dan tombol kirim ulang email verifikasi. */
export function InfoVerifikasiEmail({ email }: { email: string | null }) {
  const [memuat, setMemuat] = useState(false);
  const [galatServer, setGalatServer] = useState<GalatServer | null>(null);
  const [terkirim, setTerkirim] = useState(false);
  const [jeda, setJeda] = useState(0);

  useEffect(() => {
    if (jeda <= 0) return;
    const id = setTimeout(() => setJeda((d) => d - 1), 1000);
    return () => clearTimeout(id);
  }, [jeda]);

  async function kirimUlang() {
    if (!email) return;
    setGalatServer(null);
    setTerkirim(false);
    setMemuat(true);
    try {
      await kirimUlangVerifikasi(email);
      setTerkirim(true);
      setJeda(JEDA_KIRIM_ULANG);
    } catch (err) {
      setGalatServer(keGalatServer(err));
    } finally {
      setMemuat(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-nada-50 text-nada-600 ring-1 ring-nada-100">
        <MailCheck className="size-8" aria-hidden="true" />
      </span>
      <p className="text-sm leading-relaxed text-redup">
        Kami telah mengirim tautan verifikasi
        {email ? (
          <>
            {" "}
            ke <strong className="text-tinta">{email}</strong>
          </>
        ) : (
          " ke email Anda"
        )}
        . Buka tautan tersebut untuk mengaktifkan akun, lalu masuk ke
        Nadalaya. Periksa juga folder spam.
      </p>

      <AlertServer
        galat={galatServer}
        judul="Email belum dapat dikirim ulang"
        className="w-full text-left"
      />
      {terkirim && (
        <Alert varian="sukses" className="w-full text-left">
          Email verifikasi telah dikirim ulang.
        </Alert>
      )}

      <div className="flex w-full flex-col gap-3">
        <Button href="/masuk" lebarPenuh>
          Ke Halaman Masuk
        </Button>
        {email ? (
          <Button
            varian="garis"
            lebarPenuh
            onClick={kirimUlang}
            memuat={memuat}
            disabled={jeda > 0}
          >
            {jeda > 0 ? `Kirim ulang dalam ${jeda} detik` : "Kirim Ulang Email"}
          </Button>
        ) : (
          <p className="text-sm text-redup">
            Belum menerima email?{" "}
            <Link
              href="/daftar"
              className="font-semibold text-nada-700 underline-offset-4 hover:underline"
            >
              Daftar ulang
            </Link>{" "}
            dengan email yang benar.
          </p>
        )}
      </div>
    </div>
  );
}
