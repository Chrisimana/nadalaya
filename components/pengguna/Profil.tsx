"use client";

import { Crown } from "lucide-react";
import { useState, type FormEvent } from "react";
import { KepalaAplikasi } from "@/components/pengguna/KepalaAplikasi";
import { Alert } from "@/components/ui/Alert";
import { AlertServer, keGalatServer, type GalatServer } from "@/components/ui/AlertServer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { GagalMuat, Kerangka } from "@/components/ui/Memuat";
import { getInfoLangganan, getPenggunaSaatIni, ubahNama } from "@/lib/api";
import { LABEL_PAKET } from "@/lib/types";
import { useMuat } from "@/lib/useMuat";
import { validasiNama } from "@/lib/validasi";
import { formatTanggal } from "@/lib/waktu";

async function ambilProfil() {
  const [pengguna, langganan] = await Promise.all([
    getPenggunaSaatIni(),
    getInfoLangganan(),
  ]);
  return { pengguna, langganan };
}

function FormNama({ namaAwal }: { namaAwal: string }) {
  const [nama, setNama] = useState(namaAwal);
  const [galat, setGalat] = useState<string>();
  const [memuat, setMemuat] = useState(false);
  const [galatServer, setGalatServer] = useState<GalatServer | null>(null);
  const [berhasil, setBerhasil] = useState(false);

  async function kirim(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGalatServer(null);
    setBerhasil(false);
    const g = validasiNama(nama);
    setGalat(g);
    if (g) {
      document.getElementById("profil-nama")?.focus();
      return;
    }
    setMemuat(true);
    try {
      await ubahNama(nama.trim());
      setBerhasil(true);
    } catch (err) {
      setGalatServer(keGalatServer(err));
    } finally {
      setMemuat(false);
    }
  }

  return (
    <form onSubmit={kirim} noValidate className="flex flex-col gap-5">
      <AlertServer galat={galatServer} judul="Perubahan belum dapat disimpan" />
      {berhasil && <Alert varian="sukses">Nama berhasil diperbarui.</Alert>}
      <Input
        id="profil-nama"
        label="Nama lengkap"
        autoComplete="name"
        value={nama}
        onChange={(e) => {
          setNama(e.target.value);
          if (galat) setGalat(validasiNama(e.target.value));
        }}
        galat={galat}
      />
      <Button type="submit" memuat={memuat} className="self-start">
        {memuat ? "Menyimpan…" : "Simpan"}
      </Button>
    </form>
  );
}

/** UC-05 Mengubah Profil (FR-04). */
export function Profil() {
  const { keadaan, muatUlang } = useMuat(ambilProfil);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6">
      <KepalaAplikasi judul="Profil" deskripsi="Lihat dan ubah data akun Anda." />

      {keadaan.status === "memuat" && <Kerangka jumlah={2} tinggi="h-44" />}
      {keadaan.status === "galat" && (
        <GagalMuat judul="Profil gagal dimuat" pesan={keadaan.pesan} onMuatUlang={muatUlang} />
      )}

      {keadaan.status === "siap" && (
        <>
          {!keadaan.data.pengguna && (
            <Alert varian="info" judul="Data akun belum tersedia">
              Nama dan email akan tampil setelah akun tersambung ke server.
            </Alert>
          )}

          <Card className="flex flex-col gap-6">
            <h2 className="font-bold text-tinta">Data akun</h2>
            <FormNama namaAwal={keadaan.data.pengguna?.nama ?? ""} />
            <div className="flex flex-col gap-1.5 border-t border-garis pt-5">
              <p className="text-sm font-semibold text-tinta">Email</p>
              <p className="text-tinta">
                {keadaan.data.pengguna?.email ?? (
                  <span className="text-redup">Belum tersedia</span>
                )}
              </p>
              <p className="text-sm text-redup">Email tidak dapat diubah.</p>
            </div>
          </Card>

          <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-nada-50 text-nada-600">
                <Crown className="size-5" aria-hidden="true" />
              </span>
              <div className="flex flex-col gap-1.5">
                <h2 className="font-bold text-tinta">Paket</h2>
                <Badge varian="nada" className="self-start">
                  {LABEL_PAKET[keadaan.data.langganan.statusPaket]}
                </Badge>
                <p className="text-sm text-redup">
                  {keadaan.data.langganan.tanggalBerakhir
                    ? `Aktif hingga ${formatTanggal(keadaan.data.langganan.tanggalBerakhir)}`
                    : "Tanpa masa berlaku"}
                </p>
              </div>
            </div>
            <Button href="/langganan" varian="garis" className="self-start sm:self-auto">
              Kelola Langganan
            </Button>
          </Card>
        </>
      )}
    </div>
  );
}
