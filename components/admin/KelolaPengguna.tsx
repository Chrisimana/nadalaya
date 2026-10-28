"use client";

import { ChevronRight, SearchX, UserCheck, UserX, Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { KepalaAplikasi } from "@/components/pengguna/KepalaAplikasi";
import { Alert } from "@/components/ui/Alert";
import { AlertServer, keGalatServer, type GalatServer } from "@/components/ui/AlertServer";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { KolomCari } from "@/components/ui/KolomCari";
import { GagalMuat, Kerangka } from "@/components/ui/Memuat";
import { Pilihan } from "@/components/ui/Pilihan";
import { aktifkanPengguna, getPenggunaAdminList } from "@/lib/api";
import { LABEL_PAKET, type PenggunaAdmin, type StatusPaket } from "@/lib/types";
import { useMuat } from "@/lib/useMuat";
import { formatTanggal } from "@/lib/waktu";
import { DialogNonaktifkan } from "./DialogNonaktifkan";

const OPSI_PAKET = [
  { nilai: "semua", label: "Semua paket" },
  ...(Object.keys(LABEL_PAKET) as StatusPaket[]).map((p) => ({ nilai: p, label: LABEL_PAKET[p] })),
];

export function BadgeAkun({ aktif }: { aktif: boolean }) {
  return <Badge varian={aktif ? "sukses" : "galat"}>{aktif ? "Aktif" : "Nonaktif"}</Badge>;
}

export function KelolaPengguna() {
  const { keadaan, muatUlang } = useMuat(getPenggunaAdminList);
  const [cari, setCari] = useState("");
  const [paket, setPaket] = useState("semua");
  const [target, setTarget] = useState<PenggunaAdmin | null>(null);
  const [galatServer, setGalatServer] = useState<GalatServer | null>(null);
  const [judulGalat, setJudulGalat] = useState("Akun belum dapat dinonaktifkan");
  const [pesanSukses, setPesanSukses] = useState<string | null>(null);
  const [mengaktifkan, setMengaktifkan] = useState<string | null>(null);

  async function aktifkan(p: PenggunaAdmin) {
    setMengaktifkan(p.id);
    setGalatServer(null);
    setPesanSukses(null);
    try {
      await aktifkanPengguna(p.id);
      setPesanSukses(`Akun ${p.nama} aktif kembali dan dapat masuk ke Nadalaya.`);
      muatUlang();
    } catch (err) {
      setJudulGalat("Akun belum dapat diaktifkan");
      setGalatServer(keGalatServer(err));
    } finally {
      setMengaktifkan(null);
    }
  }

  const tersaring = useMemo(() => {
    if (keadaan.status !== "siap") return [];
    const kata = cari.trim().toLowerCase();
    return keadaan.data.filter(
      (p) =>
        (!kata || p.nama.toLowerCase().includes(kata) || p.email.toLowerCase().includes(kata)) &&
        (paket === "semua" || p.statusPaket === paket),
    );
  }, [keadaan, cari, paket]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6">
      <KepalaAplikasi
        judul="Kelola Pengguna"
        deskripsi="Daftar pengguna beserta status langganan dan status akun."
      />

      <AlertServer galat={galatServer} judul={judulGalat} />
      {pesanSukses && <Alert varian="sukses">{pesanSukses}</Alert>}

      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <KolomCari label="Cari pengguna" nilai={cari} onUbah={setCari} placeholder="Cari nama atau email…" />
        <Pilihan label="Status paket" labelTersembunyi opsi={OPSI_PAKET} value={paket} onChange={(e) => setPaket(e.target.value)} />
      </div>

      {keadaan.status === "memuat" && <Kerangka jumlah={5} tinggi="h-14" />}
      {keadaan.status === "galat" && (
        <GagalMuat judul="Data pengguna gagal dimuat" pesan={keadaan.pesan} onMuatUlang={muatUlang} />
      )}
      {keadaan.status === "siap" && keadaan.data.length === 0 && (
        <EmptyState ikon={Users} judul="Belum ada pengguna" deskripsi="Pengguna yang mendaftar akan tampil di sini." />
      )}
      {keadaan.status === "siap" && keadaan.data.length > 0 && tersaring.length === 0 && (
        <EmptyState ringkas ikon={SearchX} judul="Pengguna tidak ditemukan" deskripsi="Ubah kata kunci atau filter status paket." />
      )}

      {tersaring.length > 0 && (
        <div className="relative overflow-x-auto rounded-2xl border border-garis bg-white">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-garis bg-nada-50/60 text-left text-xs tracking-wide text-redup uppercase">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">Pengguna</th>
                <th scope="col" className="px-4 py-3 font-semibold">Paket</th>
                <th scope="col" className="px-4 py-3 font-semibold">Masa aktif</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status akun</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-garis">
              {tersaring.map((p) => (
                <tr key={p.id}>
                  <td className="px-5 py-3">
                    <p className="font-semibold text-tinta">
                      {p.nama}
                      {p.peran === "admin" && (
                        <Badge varian="nada" className="ml-2 align-middle">Admin</Badge>
                      )}
                    </p>
                    <p className="text-redup">{p.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge varian={p.statusPaket === "gratis" ? "netral" : "nada"}>{LABEL_PAKET[p.statusPaket]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-redup">
                    {p.tanggalBerakhir ? `Hingga ${formatTanggal(p.tanggalBerakhir, { ringkas: true })}` : "—"}
                  </td>
                  <td className="px-4 py-3"><BadgeAkun aktif={p.isAktif} /></td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      {p.isAktif ? (
                        <button
                          type="button"
                          onClick={() => setTarget(p)}
                          disabled={p.peran === "admin"}
                          className="flex size-9 items-center justify-center rounded-lg text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-redup/40 disabled:hover:bg-transparent"
                          aria-label={`Nonaktifkan ${p.nama}`}
                          title={p.peran === "admin" ? "Akun admin tidak dapat dinonaktifkan" : "Nonaktifkan"}
                        >
                          <UserX className="size-4" aria-hidden="true" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => aktifkan(p)}
                          disabled={mengaktifkan === p.id}
                          className="flex size-9 items-center justify-center rounded-lg text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                          aria-label={`Aktifkan kembali ${p.nama}`}
                          title="Aktifkan kembali"
                        >
                          <UserCheck className="size-4" aria-hidden="true" />
                        </button>
                      )}
                      <Link
                        href={`/admin/pengguna/${p.id}`}
                        className="flex size-9 items-center justify-center rounded-lg text-nada-700 hover:bg-nada-50"
                        aria-label={`Detail ${p.nama}`}
                      >
                        <ChevronRight className="size-5" aria-hidden="true" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DialogNonaktifkan
        pengguna={target}
        onTutup={() => setTarget(null)}
        onBerhasil={(nama) => {
          setGalatServer(null);
          setPesanSukses(`Akun ${nama} berhasil dinonaktifkan.`);
          muatUlang();
        }}
        onGalat={(g) => {
          setPesanSukses(null);
          setJudulGalat("Akun belum dapat dinonaktifkan");
          setGalatServer(g);
        }}
      />
    </div>
  );
}
