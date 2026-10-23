"use client";

import { Library, Pencil, Plus, Power, SearchX, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { KepalaAplikasi } from "@/components/pengguna/KepalaAplikasi";
import { Alert } from "@/components/ui/Alert";
import { AlertServer, keGalatServer, type GalatServer } from "@/components/ui/AlertServer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DialogKonfirmasi } from "@/components/ui/DialogKonfirmasi";
import { EmptyState } from "@/components/ui/EmptyState";
import { KolomCari } from "@/components/ui/KolomCari";
import { GagalMuat, Kerangka } from "@/components/ui/Memuat";
import { Pilihan } from "@/components/ui/Pilihan";
import { aktifkanMateri, getMateriAdminList, hapusMateri } from "@/lib/api";
import {
  LABEL_JENIS,
  LABEL_TINGKAT,
  URUTAN_JENIS,
  URUTAN_TINGKAT,
  type MateriAdmin,
} from "@/lib/types";
import { useMuat } from "@/lib/useMuat";

const OPSI_JENIS = [
  { nilai: "semua", label: "Semua jenis" },
  ...URUTAN_JENIS.map((j) => ({ nilai: j, label: LABEL_JENIS[j] })),
];
const OPSI_TINGKAT = [
  { nilai: "semua", label: "Semua tingkat" },
  ...URUTAN_TINGKAT.map((t) => ({ nilai: t, label: LABEL_TINGKAT[t] })),
];

const PESAN_DISIMPAN = {
  tambah: "Materi baru berhasil disimpan.",
  ubah: "Perubahan materi berhasil disimpan.",
} as const;

/** UC-20 s.d. UC-23: daftar materi, pencarian, filter, hapus, dan aktifkan kembali. */
export function KelolaMateri({ disimpan }: { disimpan?: keyof typeof PESAN_DISIMPAN | null }) {
  const { keadaan, muatUlang } = useMuat(getMateriAdminList);
  const [cari, setCari] = useState("");
  const [jenis, setJenis] = useState("semua");
  const [tingkat, setTingkat] = useState("semua");
  const [akanDihapus, setAkanDihapus] = useState<MateriAdmin | null>(null);
  const [menghapus, setMenghapus] = useState(false);
  const [galatServer, setGalatServer] = useState<GalatServer | null>(null);
  const [judulGalat, setJudulGalat] = useState("Materi belum dapat dihapus");
  const [pesanSukses, setPesanSukses] = useState<string | null>(
    disimpan ? PESAN_DISIMPAN[disimpan] : null,
  );
  const [mengaktifkan, setMengaktifkan] = useState<string | null>(null);

  async function aktifkan(m: MateriAdmin) {
    setMengaktifkan(m.id);
    setGalatServer(null);
    setPesanSukses(null);
    try {
      await aktifkanMateri(m.id);
      setPesanSukses(`Materi "${m.judul}" aktif kembali dan dapat dilatih pengguna.`);
      muatUlang();
    } catch (err) {
      setJudulGalat("Materi belum dapat diaktifkan");
      setGalatServer(keGalatServer(err));
    } finally {
      setMengaktifkan(null);
    }
  }

  const tersaring = useMemo(() => {
    if (keadaan.status !== "siap") return [];
    const kata = cari.trim().toLowerCase();
    return keadaan.data.filter(
      (m) =>
        (!kata || m.judul.toLowerCase().includes(kata)) &&
        (jenis === "semua" || m.jenis === jenis) &&
        (tingkat === "semua" || m.tingkat === tingkat),
    );
  }, [keadaan, cari, jenis, tingkat]);

  async function hapus() {
    if (!akanDihapus) return;
    setMenghapus(true);
    setGalatServer(null);
    setPesanSukses(null);
    try {
      const { dinonaktifkan } = await hapusMateri(akanDihapus.id);
      setPesanSukses(
        dinonaktifkan
          ? `Materi "${akanDihapus.judul}" dinonaktifkan karena sudah dipakai latihan.`
          : `Materi "${akanDihapus.judul}" berhasil dihapus.`,
      );
      muatUlang();
    } catch (err) {
      setJudulGalat("Materi belum dapat dihapus");
      setGalatServer(keGalatServer(err));
    } finally {
      setMenghapus(false);
      setAkanDihapus(null);
    }
  }

  const tombolTambah = (
    <Button href="/admin/materi/tambah" ikon={<Plus className="size-4" aria-hidden="true" />}>
      Tambah Materi
    </Button>
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6">
      <KepalaAplikasi
        judul="Kelola Materi"
        deskripsi="Materi latihan beserta jenis, tingkat, status gratis/premium, dan berkas MIDI."
        aksi={tombolTambah}
      />

      <AlertServer galat={galatServer} judul={judulGalat} />
      {pesanSukses && <Alert varian="sukses">{pesanSukses}</Alert>}

      <div className="grid gap-3 md:grid-cols-[1fr_200px_200px]">
        <KolomCari label="Cari materi" nilai={cari} onUbah={setCari} placeholder="Cari judul materi…" />
        <Pilihan label="Jenis" labelTersembunyi opsi={OPSI_JENIS} value={jenis} onChange={(e) => setJenis(e.target.value)} />
        <Pilihan label="Tingkat" labelTersembunyi opsi={OPSI_TINGKAT} value={tingkat} onChange={(e) => setTingkat(e.target.value)} />
      </div>

      {keadaan.status === "memuat" && <Kerangka jumlah={5} tinggi="h-14" />}
      {keadaan.status === "galat" && (
        <GagalMuat judul="Materi gagal dimuat" pesan={keadaan.pesan} onMuatUlang={muatUlang} />
      )}
      {keadaan.status === "siap" && keadaan.data.length === 0 && (
        <EmptyState
          ikon={Library}
          judul="Belum ada materi"
          deskripsi="Tambahkan materi tangga nada, interval, atau melodi beserta berkas MIDI-nya."
          aksi={tombolTambah}
        />
      )}
      {keadaan.status === "siap" && keadaan.data.length > 0 && tersaring.length === 0 && (
        <EmptyState ringkas ikon={SearchX} judul="Materi tidak ditemukan" deskripsi="Ubah kata kunci atau filter pencarian." />
      )}

      {tersaring.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-garis bg-white">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b border-garis bg-nada-50/60 text-left text-xs tracking-wide text-redup uppercase">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">Judul</th>
                <th scope="col" className="px-4 py-3 font-semibold">Jenis</th>
                <th scope="col" className="px-4 py-3 font-semibold">Tingkat</th>
                <th scope="col" className="px-4 py-3 font-semibold">Akses</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Tempo</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-garis">
              {tersaring.map((m) => (
                <tr key={m.id}>
                  <td className="px-5 py-3 font-semibold text-tinta">{m.judul}</td>
                  <td className="px-4 py-3">{LABEL_JENIS[m.jenis]}</td>
                  <td className="px-4 py-3">{LABEL_TINGKAT[m.tingkat]}</td>
                  <td className="px-4 py-3">
                    <Badge varian={m.isPremium ? "kuningan" : "netral"}>
                      {m.isPremium ? "Premium" : "Gratis"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{m.tempo} BPM</td>
                  <td className="px-4 py-3">
                    <Badge varian={m.isAktif ? "sukses" : "netral"}>
                      {m.isAktif ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <Link
                        href={`/admin/materi/${m.id}/ubah`}
                        className="flex size-9 items-center justify-center rounded-lg text-nada-700 hover:bg-nada-50"
                        aria-label={`Ubah ${m.judul}`}
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                      </Link>
                      {!m.isAktif && (
                        <button
                          type="button"
                          onClick={() => aktifkan(m)}
                          disabled={mengaktifkan === m.id}
                          className="flex size-9 items-center justify-center rounded-lg text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                          aria-label={`Aktifkan kembali ${m.judul}`}
                          title="Aktifkan kembali"
                        >
                          <Power className="size-4" aria-hidden="true" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setAkanDihapus(m)}
                        className="flex size-9 items-center justify-center rounded-lg text-red-700 hover:bg-red-50"
                        aria-label={`Hapus ${m.judul}`}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DialogKonfirmasi
        terbuka={akanDihapus !== null}
        judul="Hapus materi ini?"
        labelKonfirmasi="Hapus"
        memuat={menghapus}
        onKonfirmasi={hapus}
        onBatal={() => setAkanDihapus(null)}
      >
        <p>
          Materi <strong className="text-tinta">{akanDihapus?.judul}</strong>{" "}
          akan dihapus beserta berkas MIDI-nya.
        </p>
        <p className="mt-2">
          Jika materi sudah pernah dipakai latihan, materi hanya akan{" "}
          <strong className="text-tinta">dinonaktifkan</strong>, bukan dihapus,
          agar riwayat latihan pengguna tetap utuh.
        </p>
      </DialogKonfirmasi>
    </div>
  );
}
