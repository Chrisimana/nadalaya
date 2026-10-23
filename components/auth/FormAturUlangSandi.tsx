"use client";

import { CircleCheck, Clock4 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { AlertServer, keGalatServer, type GalatServer } from "@/components/ui/AlertServer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { simpanKataSandiBaru, TautanKedaluwarsaError } from "@/lib/api";
import {
  adaGalat,
  MIN_PANJANG_SANDI,
  validasiKataSandiBaruDanKonfirmasi,
  type GalatKolom,
} from "@/lib/validasi";

type Kolom = "kataSandi" | "konfirmasi";

function TautanKedaluwarsa() {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-kuningan-50 text-kuningan-600">
        <Clock4 className="size-7" aria-hidden="true" />
      </span>
      <p className="text-lg font-bold text-tinta">Tautan kedaluwarsa</p>
      <p className="text-sm leading-relaxed text-redup">
        Tautan atur ulang kata sandi sudah tidak berlaku atau sudah pernah
        dipakai. Silakan minta tautan baru.
      </p>
      <Button href="/lupa-kata-sandi" lebarPenuh className="mt-2">
        Minta Tautan Baru
      </Button>
    </div>
  );
}

export function FormAturUlangSandi({ kedaluwarsa }: { kedaluwarsa?: boolean }) {
  const [data, setData] = useState({ kataSandi: "", konfirmasi: "" });
  const [galat, setGalat] = useState<GalatKolom<Kolom>>({});
  const [sudahDikirim, setSudahDikirim] = useState(false);
  const [memuat, setMemuat] = useState(false);
  const [galatServer, setGalatServer] = useState<GalatServer | null>(null);
  const [status, setStatus] = useState<"isi" | "berhasil" | "kedaluwarsa">(
    kedaluwarsa ? "kedaluwarsa" : "isi",
  );

  function ubah(kolom: Kolom, nilai: string) {
    const baru = { ...data, [kolom]: nilai };
    setData(baru);
    if (sudahDikirim) setGalat(validasiKataSandiBaruDanKonfirmasi(baru));
  }

  async function kirim(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSudahDikirim(true);
    setGalatServer(null);
    const hasil = validasiKataSandiBaruDanKonfirmasi(data);
    setGalat(hasil);
    if (adaGalat(hasil)) {
      const pertama = (["kataSandi", "konfirmasi"] as const).find((k) => hasil[k]);
      document.getElementById(`atur-${pertama}`)?.focus();
      return;
    }
    setMemuat(true);
    try {
      await simpanKataSandiBaru(data.kataSandi);
      setStatus("berhasil");
    } catch (err) {
      if (err instanceof TautanKedaluwarsaError) setStatus("kedaluwarsa");
      else setGalatServer(keGalatServer(err));
    } finally {
      setMemuat(false);
    }
  }

  if (status === "kedaluwarsa") return <TautanKedaluwarsa />;

  if (status === "berhasil") {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CircleCheck className="size-7" aria-hidden="true" />
        </span>
        <p className="text-lg font-bold text-tinta">Kata sandi berhasil diubah</p>
        <p className="text-sm leading-relaxed text-redup">
          Silakan masuk dengan kata sandi baru Anda.
        </p>
        <Button href="/masuk" lebarPenuh className="mt-2">
          Masuk
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={kirim} noValidate className="flex flex-col gap-5">
      <AlertServer galat={galatServer} judul="Kata sandi belum dapat disimpan" />
      <Input
        id="atur-kataSandi"
        label="Kata sandi baru"
        type="password"
        autoComplete="new-password"
        value={data.kataSandi}
        onChange={(e) => ubah("kataSandi", e.target.value)}
        galat={galat.kataSandi}
        petunjuk={`Minimal ${MIN_PANJANG_SANDI} karakter.`}
      />
      <Input
        id="atur-konfirmasi"
        label="Konfirmasi kata sandi baru"
        type="password"
        autoComplete="new-password"
        value={data.konfirmasi}
        onChange={(e) => ubah("konfirmasi", e.target.value)}
        galat={galat.konfirmasi}
      />
      <Button type="submit" ukuran="lg" lebarPenuh memuat={memuat}>
        {memuat ? "Menyimpan…" : "Simpan Kata Sandi"}
      </Button>
    </form>
  );
}
