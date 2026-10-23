"use client";

import { FileMusic, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { AlertServer, keGalatServer, type GalatServer } from "@/components/ui/AlertServer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Pilihan } from "@/components/ui/Pilihan";
import { simpanMateri } from "@/lib/api";
import {
  LABEL_JENIS,
  LABEL_TINGKAT,
  URUTAN_JENIS,
  URUTAN_TINGKAT,
  type JenisMateri,
  type MateriAdmin,
  type TingkatMateri,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  adaGalat,
  TEMPO_MAX,
  TEMPO_MIN,
  validasiBerkasMidi,
  validasiMateri,
  type GalatKolom,
} from "@/lib/validasi";

type Kolom = "judul" | "tempo" | "berkasMidi";

function PilihanAkses({
  premium,
  onUbah,
}: {
  premium: boolean;
  onUbah: (premium: boolean) => void;
}) {
  const opsi = [
    { nilai: false, label: "Gratis", isi: "Dapat dilatih semua pengguna." },
    { nilai: true, label: "Premium", isi: "Hanya untuk Premium dan Uji Coba." },
  ];
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-semibold text-tinta">Status akses</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {opsi.map((o) => (
          <label
            key={o.label}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors",
              premium === o.nilai
                ? "border-nada-500 bg-nada-50 ring-3 ring-nada-100"
                : "border-garis bg-white hover:border-nada-300",
            )}
          >
            <input
              type="radio"
              name="akses"
              checked={premium === o.nilai}
              onChange={() => onUbah(o.nilai)}
              className="mt-1 accent-nada-700"
            />
            <span>
              <span className="block text-sm font-semibold text-tinta">{o.label}</span>
              <span className="block text-xs text-redup">{o.isi}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function UnggahMidi({
  berkas,
  namaLama,
  galat,
  onPilih,
}: {
  berkas: File | null;
  namaLama: string | null;
  galat?: string;
  onPilih: (berkas: File | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col gap-1.5">
      <p id="label-midi" className="text-sm font-semibold text-tinta">
        Berkas MIDI
      </p>
      {namaLama && (
        <p className="text-sm text-redup">
          Berkas saat ini: <strong className="text-tinta">{namaLama}</strong>
        </p>
      )}
      <div
        className={cn(
          "flex flex-col gap-3 rounded-xl border border-dashed p-4 sm:flex-row sm:items-center",
          galat ? "border-red-400 bg-red-50/40" : "border-nada-200 bg-nada-50/40",
        )}
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-nada-600 ring-1 ring-nada-100">
          <FileMusic className="size-5" aria-hidden="true" />
        </span>
        <p className="min-w-0 flex-1 truncate text-sm text-tinta">
          {berkas ? (
            <strong>{berkas.name}</strong>
          ) : (
            <span className="text-redup">
              {namaLama ? "Belum ada berkas pengganti dipilih." : "Belum ada berkas dipilih."}
            </span>
          )}
        </p>
        <input
          ref={input}
          id="materi-berkasMidi"
          type="file"
          accept=".mid,audio/midi,audio/x-midi"
          aria-labelledby="label-midi"
          aria-describedby="keterangan-midi"
          className="sr-only"
          onChange={(e) => onPilih(e.target.files?.[0] ?? null)}
        />
        <Button
          varian="garis"
          ukuran="sm"
          onClick={() => input.current?.click()}
          ikon={<Upload className="size-4" aria-hidden="true" />}
        >
          {namaLama ? "Ganti Berkas" : "Pilih Berkas"}
        </Button>
      </div>
      <p
        id="keterangan-midi"
        className={cn("text-sm", galat ? "text-red-600" : "text-redup")}
      >
        {galat ??
          (namaLama
            ? "Berkas lama tetap dipakai jika tidak diganti. Hanya berkas .mid berisi melodi tunggal."
            : "Hanya berkas .mid berisi melodi tunggal. Notasi balok dibuat otomatis dari berkas ini.")}
      </p>
    </div>
  );
}

export function FormMateri({ materi }: { materi?: MateriAdmin }) {
  const router = useRouter();
  const mode = materi ? "ubah" : "tambah";
  const [judul, setJudul] = useState(materi?.judul ?? "");
  const [jenis, setJenis] = useState<JenisMateri>(materi?.jenis ?? "tangga_nada");
  const [tingkat, setTingkat] = useState<TingkatMateri>(materi?.tingkat ?? "dasar");
  const [premium, setPremium] = useState(materi?.isPremium ?? false);
  const [tempo, setTempo] = useState(materi ? String(materi.tempo) : "");
  const [berkasMidi, setBerkasMidi] = useState<File | null>(null);
  const [galat, setGalat] = useState<GalatKolom<Kolom>>({});
  const [sudahDikirim, setSudahDikirim] = useState(false);
  const [memuat, setMemuat] = useState(false);
  const [galatServer, setGalatServer] = useState<GalatServer | null>(null);

  function periksa(ubah: Partial<{ judul: string; tempo: string; berkasMidi: File | null }>) {
    if (!sudahDikirim) return;
    setGalat(validasiMateri({ judul, tempo, berkasMidi, ...ubah }, mode));
  }

  async function kirim(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSudahDikirim(true);
    setGalatServer(null);
    const hasil = validasiMateri({ judul, tempo, berkasMidi }, mode);
    setGalat(hasil);
    if (adaGalat(hasil)) {
      const pertama = (["judul", "tempo", "berkasMidi"] as const).find((k) => hasil[k]);
      document.getElementById(`materi-${pertama}`)?.focus();
      return;
    }
    setMemuat(true);
    try {
      await simpanMateri(
        { judul: judul.trim(), jenis, tingkat, isPremium: premium, tempo: Number(tempo), berkasMidi },
        materi?.id,
      );
      router.push(`/admin/materi?disimpan=${mode}`);
    } catch (err) {
      setGalatServer(keGalatServer(err));
      setMemuat(false);
    }
  }

  return (
    <Card>
      <form onSubmit={kirim} noValidate className="flex flex-col gap-6">
        <AlertServer galat={galatServer} judul="Materi belum dapat disimpan" />
        <Input
          id="materi-judul"
          label="Judul materi"
          placeholder="Contoh: Tangga Nada C Mayor"
          value={judul}
          onChange={(e) => {
            setJudul(e.target.value);
            periksa({ judul: e.target.value });
          }}
          galat={galat.judul}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Pilihan
            label="Jenis"
            value={jenis}
            onChange={(e) => setJenis(e.target.value as JenisMateri)}
            opsi={URUTAN_JENIS.map((j) => ({ nilai: j, label: LABEL_JENIS[j] }))}
          />
          <Pilihan
            label="Tingkat"
            value={tingkat}
            onChange={(e) => setTingkat(e.target.value as TingkatMateri)}
            opsi={URUTAN_TINGKAT.map((t) => ({ nilai: t, label: LABEL_TINGKAT[t] }))}
          />
        </div>
        <PilihanAkses premium={premium} onUbah={setPremium} />
        <Input
          id="materi-tempo"
          label="Tempo (BPM)"
          type="number"
          inputMode="numeric"
          min={TEMPO_MIN}
          max={TEMPO_MAX}
          placeholder="Contoh: 80"
          value={tempo}
          onChange={(e) => {
            setTempo(e.target.value);
            periksa({ tempo: e.target.value });
          }}
          galat={galat.tempo}
          petunjuk={`Bilangan bulat ${TEMPO_MIN}–${TEMPO_MAX}.`}
          className="sm:max-w-xs"
        />
        <UnggahMidi
          berkas={berkasMidi}
          namaLama={materi?.namaBerkasMidi ?? null}
          galat={galat.berkasMidi}
          onPilih={(b) => {
            setBerkasMidi(b);
            // Ekstensi langsung diperiksa saat berkas dipilih.
            const pesan = validasiBerkasMidi(b, mode === "tambah" && sudahDikirim);
            setGalat((g) => {
              const baru = { ...g };
              delete baru.berkasMidi;
              if (pesan) baru.berkasMidi = pesan;
              return baru;
            });
          }}
        />
        <div className="flex flex-col-reverse gap-3 border-t border-garis pt-6 sm:flex-row sm:justify-end">
          <Button href="/admin/materi" varian="garis">
            Batal
          </Button>
          <Button type="submit" memuat={memuat}>
            {memuat ? "Menyimpan…" : mode === "tambah" ? "Simpan Materi" : "Simpan Perubahan"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
