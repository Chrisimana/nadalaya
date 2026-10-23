"use client";

import { Mic, SearchX, UserCheck, UserX } from "lucide-react";
import { useCallback, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { AlertServer, keGalatServer, type GalatServer } from "@/components/ui/AlertServer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { GagalMuat, Kerangka } from "@/components/ui/Memuat";
import { aktifkanPengguna, getPenggunaAdminById } from "@/lib/api";
import { LABEL_JENIS, LABEL_PAKET } from "@/lib/types";
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
  const [judulGalat, setJudulGalat] = useState("Akun belum dapat dinonaktifkan");
  const [sukses, setSukses] = useState<string | null>(null);
  const [mengaktifkan, setMengaktifkan] = useState(false);

  async function aktifkan(id: string) {
    setMengaktifkan(true);
    setGalatServer(null);
    setSukses(null);
    try {
      await aktifkanPengguna(id);
      setSukses("Akun berhasil diaktifkan kembali.");
      muatUlang();
    } catch (err) {
      setJudulGalat("Akun belum dapat diaktifkan");
      setGalatServer(keGalatServer(err));
    } finally {
      setMengaktifkan(false);
    }
  }

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
      <AlertServer galat={galatServer} judul={judulGalat} />
      {sukses && <Alert varian="sukses">{sukses}</Alert>}
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
        <div className="flex flex-col items-end gap-2 border-t border-garis pt-4">
          {p.peran === "admin" ? (
            <p className="text-sm text-redup">Akun admin tidak dapat dinonaktifkan.</p>
          ) : p.isAktif ? (
            <Button
              varian="bahaya"
              onClick={() => setKonfirmasi(true)}
              ikon={<UserX className="size-4" aria-hidden="true" />}
            >
              Nonaktifkan Akun
            </Button>
          ) : (
            <Button
              memuat={mengaktifkan}
              onClick={() => aktifkan(p.id)}
              ikon={<UserCheck className="size-4" aria-hidden="true" />}
            >
              Aktifkan Kembali
            </Button>
          )}
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="font-bold text-tinta">5 latihan terakhir</h2>
        {p.latihanTerakhir.length === 0 ? (
          <EmptyState ringkas ikon={Mic} judul="Belum ada latihan" deskripsi="Pengguna ini belum menyelesaikan latihan." />
        ) : (
          <ul className="divide-y divide-garis">
            {p.latihanTerakhir.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-tinta">{l.judulMateri}</p>
                  <p className="text-redup">
                    {LABEL_JENIS[l.jenis]} · {formatTanggal(l.tanggal, { denganJam: true, ringkas: true })}
                  </p>
                </div>
                <span className="shrink-0 font-serif text-xl font-semibold text-nada-800 tabular-nums">
                  {l.skor}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <DialogNonaktifkan
        pengguna={konfirmasi ? { id: p.id, nama: p.nama } : null}
        onTutup={() => setKonfirmasi(false)}
        onBerhasil={() => {
          setGalatServer(null);
          setSukses("Akun berhasil dinonaktifkan dan seluruh sesinya diakhiri.");
          muatUlang();
        }}
        onGalat={(g) => {
          setSukses(null);
          setJudulGalat("Akun belum dapat dinonaktifkan");
          setGalatServer(g);
        }}
      />
    </div>
  );
}
