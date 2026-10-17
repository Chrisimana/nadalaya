"use client";

import { MailCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { AlertServer, keGalatServer, type GalatServer } from "@/components/ui/AlertServer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { kirimTautanResetSandi } from "@/lib/api";
import { validasiEmail } from "@/lib/validasi";

/** UC-03 langkah 1–2: meminta tautan atur ulang kata sandi. */
export function FormLupaSandi() {
  const [email, setEmail] = useState("");
  const [galat, setGalat] = useState<string>();
  const [sudahDikirim, setSudahDikirim] = useState(false);
  const [memuat, setMemuat] = useState(false);
  const [galatServer, setGalatServer] = useState<GalatServer | null>(null);
  const [terkirim, setTerkirim] = useState(false);

  async function kirim(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSudahDikirim(true);
    setGalatServer(null);
    const g = validasiEmail(email);
    setGalat(g);
    if (g) {
      document.getElementById("lupa-email")?.focus();
      return;
    }
    setMemuat(true);
    try {
      await kirimTautanResetSandi(email.trim());
      setTerkirim(true);
    } catch (err) {
      setGalatServer(keGalatServer(err));
    } finally {
      setMemuat(false);
    }
  }

  if (terkirim) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <MailCheck className="size-7" aria-hidden="true" />
        </span>
        <p className="text-lg font-bold text-tinta">
          Tautan atur ulang dikirim ke email Anda
        </p>
        <p className="text-sm leading-relaxed text-redup">
          Jika <strong className="text-tinta">{email.trim()}</strong> terdaftar,
          buka tautan di email tersebut untuk membuat kata sandi baru. Periksa
          juga folder spam.
        </p>
        <Button href="/masuk" lebarPenuh className="mt-2">
          Kembali ke Halaman Masuk
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={kirim} noValidate className="flex flex-col gap-5">
      <AlertServer galat={galatServer} judul="Tautan belum dapat dikirim" />
      <Input
        id="lupa-email"
        label="Email terdaftar"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="nama@email.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (sudahDikirim) setGalat(validasiEmail(e.target.value));
        }}
        galat={galat}
      />
      <Button type="submit" ukuran="lg" lebarPenuh memuat={memuat}>
        {memuat ? "Mengirim…" : "Kirim Tautan"}
      </Button>
    </form>
  );
}
