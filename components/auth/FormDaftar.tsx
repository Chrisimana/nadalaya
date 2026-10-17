"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { adalahBelumTersambung, pesanGalat, register } from "@/lib/api";
import {
  adaGalat,
  MIN_PANJANG_SANDI,
  validasiRegistrasi,
  type GalatKolom,
} from "@/lib/validasi";

type Kolom = "nama" | "email" | "kataSandi";

/** UC-01 Mendaftar Akun. */
export function FormDaftar() {
  const router = useRouter();
  const [data, setData] = useState({ nama: "", email: "", kataSandi: "" });
  const [galat, setGalat] = useState<GalatKolom<Kolom>>({});
  const [sudahDikirim, setSudahDikirim] = useState(false);
  const [memuat, setMemuat] = useState(false);
  const [galatServer, setGalatServer] = useState<{
    pesan: string;
    belumTersambung: boolean;
  } | null>(null);

  function ubah(kolom: Kolom, nilai: string) {
    const baru = { ...data, [kolom]: nilai };
    setData(baru);
    // Setelah percobaan pertama, galat diperbarui sambil mengetik.
    if (sudahDikirim) setGalat(validasiRegistrasi(baru));
  }

  async function kirim(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSudahDikirim(true);
    setGalatServer(null);

    const hasil = validasiRegistrasi(data);
    setGalat(hasil);
    if (adaGalat(hasil)) {
      const pertama = (["nama", "email", "kataSandi"] as const).find(
        (k) => hasil[k],
      );
      document.getElementById(`daftar-${pertama}`)?.focus();
      return;
    }

    setMemuat(true);
    try {
      const { perluVerifikasi } = await register({
        nama: data.nama.trim(),
        email: data.email.trim(),
        kataSandi: data.kataSandi,
      });
      if (perluVerifikasi) {
        // UC-01 langkah 3.4: arahkan ke informasi verifikasi email.
        router.push(
          `/verifikasi-email?email=${encodeURIComponent(data.email.trim())}`,
        );
      } else {
        router.replace("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setGalatServer({
        pesan: pesanGalat(err),
        belumTersambung: adalahBelumTersambung(err),
      });
      setMemuat(false);
    }
  }

  return (
    <form onSubmit={kirim} noValidate className="flex flex-col gap-5">
      {galatServer && (
        <Alert
          varian={galatServer.belumTersambung ? "peringatan" : "galat"}
          judul="Pendaftaran belum dapat diproses"
        >
          {galatServer.pesan}
        </Alert>
      )}

      <Input
        id="daftar-nama"
        label="Nama lengkap"
        name="nama"
        autoComplete="name"
        placeholder="Nama Anda"
        value={data.nama}
        onChange={(e) => ubah("nama", e.target.value)}
        galat={galat.nama}
      />
      <Input
        id="daftar-email"
        label="Email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="nama@email.com"
        value={data.email}
        onChange={(e) => ubah("email", e.target.value)}
        galat={galat.email}
      />
      <Input
        id="daftar-kataSandi"
        label="Kata sandi"
        name="kataSandi"
        type="password"
        autoComplete="new-password"
        value={data.kataSandi}
        onChange={(e) => ubah("kataSandi", e.target.value)}
        galat={galat.kataSandi}
        petunjuk={`Minimal ${MIN_PANJANG_SANDI} karakter.`}
      />

      <Button type="submit" ukuran="lg" lebarPenuh memuat={memuat}>
        {memuat ? "Mendaftarkan…" : "Daftar"}
      </Button>
    </form>
  );
}
