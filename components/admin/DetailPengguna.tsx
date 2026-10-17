"use client";

import { SearchX, UserX } from "lucide-react";
import { useCallback, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { AlertServer, type GalatServer } from "@/components/ui/AlertServer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { GagalMuat, Kerangka } from "@/components/ui/Memuat";
import { getPenggunaAdminById } from "@/lib/api";
import { LABEL_PAKET } from "@/lib/types";
import { useMuat } from "@/lib/useMuat";
import { formatTanggal } from "@/lib/waktu";
import { DialogNonaktifkan } from "./DialogNonaktifkan";
import { BadgeAkun } from "./KelolaPengguna";

function Baris({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 sm:flex-row sm:justify-between sm:gap-6">
      <dt className="text-sm text-redup">{label}</dt>
      <dd className="text-sm font-semibold break-all text-tinta sm:text-right">{children}</dd>
    </div>
  );
}

/** Detail satu pengguna untuk admin (UC-24) dengan tombol Nonaktifkan (UC-25). */
export function DetailPengguna({ id }: { id: string }) {
  const ambil = useCallback(() => getPenggunaAdminById(id), [id]);
  const { keadaan, muatUlang } = useMuat(ambil);
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [galatServer, setGalatServer] = useState<GalatServer | null>(null);
  const [sukses, setSukses] = useState(false);

  if (keadaan.status === "memuat") return <Kerangka jumlah={1} tinggi="h-72" />;
  if (keadaan.status === "galat") {
    return <GagalMuat judul="Data pengguna gagal dimuat" pesan={keadaan.pesan} onMuatUlang={muatUlang} />;
  }
  if (!keadaan.data) {
    return (
      <EmptyState
        ikon={SearchX}
        judul="Pengguna tidak ditemukan"
        deskripsi="Akun ini tidak tersedia."
        aksi={<Button href="/admin/pengguna">Kembali ke Kelola Pengguna</Button>}
      />
    );
  }

  const p = keadaan.data;
  return (
    <div className="flex flex-col gap-5">
      <AlertServer galat={galatServer} judul="Akun belum dapat dinonaktifkan" />
      {sukses && <Alert varian="sukses">Akun berhasil dinonaktifkan.</Alert>}
      <Card className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xl font-bold text-tinta">{p.nama}</p>
            <p className="text-redup">{p.email}</p>
          </div>
          <BadgeAkun aktif={p.isAktif} />
        </div>
        <dl className="divide-y divide-garis border-t border-garis">
          <Baris label="Peran">{p.peran === "admin" ? "Admin" : "Pengguna"}</Baris>
          <Baris label="Status paket">
            <Badge varian={p.statusPaket === "gratis" ? "netral" : "nada"}>{LABEL_PAKET[p.statusPaket]}</Badge>
          </Baris>
          <Baris label="Masa aktif">
            {p.tanggalBerakhir ? `Hingga ${formatTanggal(p.tanggalBerakhir)}` : "Tanpa masa berlaku"}
          </Baris>
          <Baris label="Terdaftar sejak">{formatTanggal(p.terdaftar)}</Baris>
          <Baris label="Jumlah latihan">{p.jumlahLatihan}</Baris>
        </dl>
        <div className="flex justify-end border-t border-garis pt-4">
          <Button
            varian="bahaya"
            disabled={!p.isAktif}
            onClick={() => setKonfirmasi(true)}
            ikon={<UserX className="size-4" aria-hidden="true" />}
          >
            Nonaktifkan Akun
          </Button>
        </div>
      </Card>
      <DialogNonaktifkan
        pengguna={konfirmasi ? { id: p.id, nama: p.nama } : null}
        onTutup={() => setKonfirmasi(false)}
        onBerhasil={() => {
          setGalatServer(null);
          setSukses(true);
          muatUlang();
        }}
        onGalat={(g) => {
          setSukses(false);
          setGalatServer(g);
        }}
      />
    </div>
  );
}
