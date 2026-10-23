"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { adalahBelumTersambung, GalatApi, login, pesanGalat } from "@/lib/api";
import { adaGalat, validasiMasuk, type GalatKolom } from "@/lib/validasi";

type Kolom = "email" | "kataSandi";

export type PemberitahuanMasuk = "verifikasi_berhasil" | "verifikasi_gagal" | "nonaktif" | null;

const PEMBERITAHUAN: Record<
  Exclude<PemberitahuanMasuk, null>,
  { varian: "sukses" | "galat" | "peringatan"; judul: string; pesan: string }
> = {
  verifikasi_berhasil: {
    varian: "sukses",
    judul: "Email berhasil diverifikasi",
    pesan: "Akun Anda sudah aktif. Silakan masuk.",
  },
  verifikasi_gagal: {
    varian: "peringatan",
    judul: "Tautan verifikasi tidak berlaku",
    pesan: "Tautan sudah kedaluwarsa atau pernah dipakai. Coba masuk; jika diminta, kirim ulang email verifikasi.",
  },
  nonaktif: {
    varian: "galat",
    judul: "Tidak dapat masuk",
    pesan: "Akun Anda telah dinonaktifkan.",
  },
};

function tujuanAman(lanjut: string | null | undefined) {
  return lanjut && lanjut.startsWith("/") && !lanjut.startsWith("//") && !lanjut.startsWith("/admin")
    ? lanjut
    : "/dashboard";
}

export function FormMasuk({
  pemberitahuan = null,
  lanjut,
}: {
  pemberitahuan?: PemberitahuanMasuk;
  lanjut?: string | null;
}) {
  const router = useRouter();
  const [data, setData] = useState({ email: "", kataSandi: "" });
  const [galat, setGalat] = useState<GalatKolom<Kolom>>({});
  const [sudahDikirim, setSudahDikirim] = useState(false);
  const [memuat, setMemuat] = useState(false);
  const [galatServer, setGalatServer] = useState<{
    pesan: string;
    belumTersambung: boolean;
  } | null>(null);
  const [belumVerifikasi, setBelumVerifikasi] = useState(false);
  const info = pemberitahuan && !galatServer ? PEMBERITAHUAN[pemberitahuan] : null;

  function ubah(kolom: Kolom, nilai: string) {
    const baru = { ...data, [kolom]: nilai };
    setData(baru);
    if (sudahDikirim) setGalat(validasiMasuk(baru));
  }

  async function kirim(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSudahDikirim(true);
    setGalatServer(null);
    setBelumVerifikasi(false);

    const hasil = validasiMasuk(data);
    setGalat(hasil);
    if (adaGalat(hasil)) {
      const pertama = (["email", "kataSandi"] as const).find((k) => hasil[k]);
      document.getElementById(`masuk-${pertama}`)?.focus();
      return;
    }

    setMemuat(true);
    try {
      const pengguna = await login({
        email: data.email.trim(),
        kataSandi: data.kataSandi,
      });
      // Arahkan ke dashboard sesuai peran.
      router.replace(pengguna.peran === "admin" ? "/admin" : tujuanAman(lanjut));
      router.refresh();
    } catch (err) {
      setBelumVerifikasi(err instanceof GalatApi && err.kode === "email_belum_verifikasi");
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
          judul="Belum dapat masuk"
        >
          {galatServer.pesan}
          {belumVerifikasi && (
            <>
              {" "}
              <Link
                href={`/verifikasi-email?email=${encodeURIComponent(data.email.trim())}`}
                className="font-semibold underline underline-offset-4"
              >
                Kirim ulang email verifikasi
              </Link>
            </>
          )}
        </Alert>
      )}
      {info && (
        <Alert varian={info.varian} judul={info.judul}>
          {info.pesan}
        </Alert>
      )}

      <Input
        id="masuk-email"
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
      <div className="flex flex-col gap-2">
        <Input
          id="masuk-kataSandi"
          label="Kata sandi"
          name="kataSandi"
          type="password"
          autoComplete="current-password"
          value={data.kataSandi}
          onChange={(e) => ubah("kataSandi", e.target.value)}
          galat={galat.kataSandi}
        />
        <Link
          href="/lupa-kata-sandi"
          className="self-end text-sm font-semibold text-nada-700 underline-offset-4 hover:underline"
        >
          Lupa kata sandi?
        </Link>
      </div>

      <Button type="submit" ukuran="lg" lebarPenuh memuat={memuat}>
        {memuat ? "Memeriksa…" : "Masuk"}
      </Button>
    </form>
  );
}
