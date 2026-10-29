"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { AlertServer, keGalatServer, type GalatServer } from "@/components/ui/AlertServer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { kirimUlangVerifikasi } from "@/lib/api";
import { validasiEmail } from "@/lib/validasi";

const JEDA_KIRIM_ULANG = 60;

export function FormKirimUlangVerifikasi() {
  const [email, setEmail] = useState("");
  const [galat, setGalat] = useState<string>();
  const [sudahDikirim, setSudahDikirim] = useState(false);
  const [memuat, setMemuat] = useState(false);
  const [galatServer, setGalatServer] = useState<GalatServer | null>(null);
  const [terkirim, setTerkirim] = useState(false);
  const [jeda, setJeda] = useState(0);

  useEffect(() => {
    if (jeda <= 0) return;
    const id = setTimeout(() => setJeda((d) => d - 1), 1000);
    return () => clearTimeout(id);
  }, [jeda]);

  async function kirim(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSudahDikirim(true);
    setGalatServer(null);
    setTerkirim(false);
    const g = validasiEmail(email);
    setGalat(g);
    if (g) {
      document.getElementById("ulang-email")?.focus();
      return;
    }
    setMemuat(true);
    try {
      await kirimUlangVerifikasi(email.trim());
      setTerkirim(true);
      setJeda(JEDA_KIRIM_ULANG);
    } catch (err) {
      setGalatServer(keGalatServer(err));
    } finally {
      setMemuat(false);
    }
  }

  return (
    <form onSubmit={kirim} noValidate className="flex flex-col gap-5">
      <AlertServer galat={galatServer} judul="Email belum dapat dikirim ulang" />
      {terkirim && (
        <Alert varian="sukses">
          Jika email tersebut terdaftar dan belum diverifikasi, tautan verifikasi baru telah dikirim. Periksa
          juga folder spam.
        </Alert>
      )}
      <Input
        id="ulang-email"
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
      <Button type="submit" ukuran="lg" lebarPenuh memuat={memuat} disabled={jeda > 0}>
        {memuat ? "Mengirim…" : jeda > 0 ? `Kirim ulang dalam ${jeda} detik` : "Kirim Ulang Email Verifikasi"}
      </Button>
    </form>
  );
}
