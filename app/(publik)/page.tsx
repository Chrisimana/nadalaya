import {
  ArrowRight,
  AudioWaveform,
  BookOpen,
  ChartLine,
  Headphones,
  ListMusic,
  Mic,
  ShieldCheck,
  TrendingUp,
  Target,
  type LucideIcon,
} from "lucide-react";
import { IlustrasiHero } from "@/components/beranda/IlustrasiHero";
import { AjakanDaftar } from "@/components/publik/AjakanDaftar";
import { Button } from "@/components/ui/Button";
import { DAFTAR_PAKET, formatRupiah } from "@/lib/paket";

const langkah: { ikon: LucideIcon; judul: string; isi: string }[] = [
  {
    ikon: ListMusic,
    judul: "Pilih materi",
    isi: "Tangga nada, interval, atau melodi pendek sesuai tingkat Anda.",
  },
  {
    ikon: Headphones,
    judul: "Dengarkan acuan",
    isi: "Putar acuan MIDI sambil membaca notasi balok di layar.",
  },
  {
    ikon: Mic,
    judul: "Rekam nyanyian",
    isi: "Nyanyikan langsung dari browser, maksimal 60 detik.",
  },
  {
    ikon: Target,
    judul: "Lihat skor",
    isi: "Dapatkan skor 0–100 dan lihat nada mana yang meleset.",
  },
];

const fitur: { ikon: LucideIcon; judul: string; isi: string }[] = [
  {
    ikon: AudioWaveform,
    judul: "Deteksi nada dengan CREPE",
    isi: "Model deep learning membaca tinggi nada nyanyian Anda bingkai demi bingkai, langsung di browser.",
  },
  {
    ikon: Target,
    judul: "Penilaian adil dengan DTW",
    isi: "Dynamic Time Warping menyelaraskan nyanyian dengan acuan, jadi bernyanyi sedikit lebih cepat atau lambat tidak mengurangi skor.",
  },
  {
    ikon: ChartLine,
    judul: "Grafik nada yang jelas",
    isi: "Bandingkan garis nada Anda dengan acuan dan temukan nada yang meleset lebih dari 50 cent.",
  },
  {
    ikon: BookOpen,
    judul: "Notasi balok otomatis",
    isi: "Setiap materi ditampilkan dalam notasi balok dan dapat diputar sebagai acuan.",
  },
  {
    ikon: TrendingUp,
    judul: "Pantau progres",
    isi: "Pengguna Premium dapat melihat perkembangan skor dari waktu ke waktu.",
  },
  {
    ikon: ShieldCheck,
    judul: "Rekaman tetap di perangkat",
    isi: "Suara Anda dianalisis di browser dan tidak diunggah ke server. Yang disimpan hanya hasil analisis.",
  },
];

const paket = (kode: (typeof DAFTAR_PAKET)[number]["kode"]) =>
  DAFTAR_PAKET.find((p) => p.kode === kode)!;

const ringkasanHarga = [
  {
    nama: "Gratis",
    harga: "Rp0",
    satuan: "",
    isi: "3 analisis per hari dan materi tangga nada dasar.",
  },
  {
    nama: "Premium",
    harga: formatRupiah(paket("premium_bulanan").harga),
    satuan: "/ bulan",
    isi: "Analisis tanpa batas, semua materi, riwayat latihan, dan grafik progres.",
  },
  {
    nama: "Uji Coba Premium",
    harga: "7 hari",
    satuan: "gratis",
    isi: "Coba semua fitur Premium satu kali per akun.",
  },
];

export default function Beranda() {
  return (
    <>
      <section className="latar-paranada relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-14 pb-20 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-20 lg:pb-28">
          <div>
            <h1 className="font-serif text-4xl leading-[1.1] font-semibold tracking-tight text-nada-900 sm:text-5xl lg:text-6xl">
              Latih solfeggio, ketahui nada mana yang meleset.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-redup">
              Nadalaya menilai akurasi nada nyanyian Anda terhadap acuan MIDI.
              Dengarkan, rekam, lalu lihat skor dan grafik nadanya dalam
              hitungan detik.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button href="/daftar" ukuran="lg">
                Daftar
              </Button>
              <Button href="/masuk" ukuran="lg" varian="garis">
                Saya Sudah Punya Akun
              </Button>
            </div>
            <p className="mt-4 text-sm text-redup">
              Gratis 3 analisis per hari. Tanpa kartu kredit.
            </p>
          </div>
          <IlustrasiHero />
        </div>
      </section>

      <section
        id="cara-kerja"
        className="scroll-mt-20 border-y border-garis bg-white"
      >
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <h2 className="font-serif text-3xl font-semibold text-nada-900 sm:text-4xl">
            Empat langkah sekali latihan
          </h2>
          <p className="mt-3 max-w-2xl text-redup">
            Satu latihan cukup beberapa menit, dari memilih materi sampai
            melihat skor.
          </p>
          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {langkah.map(({ ikon: Ikon, judul, isi }, i) => (
              <li key={judul} className="relative flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-nada-700 text-white">
                    <Ikon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="font-serif text-2xl font-semibold text-kuningan-500">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-tinta">{judul}</h3>
                <p className="text-sm leading-relaxed text-redup">{isi}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="fitur" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <h2 className="font-serif text-3xl font-semibold text-nada-900 sm:text-4xl">
            Umpan balik objektif, tanpa harus ditemani pelatih
          </h2>
          <p className="mt-3 max-w-2xl text-redup">
            Nadalaya fokus pada ketepatan nada dan urutannya, bagian yang paling
            sulit dinilai sendiri saat berlatih.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {fitur.map(({ ikon: Ikon, judul, isi }) => (
              <article
                key={judul}
                className="rounded-2xl border border-garis bg-white p-6"
              >
                <span className="flex size-10 items-center justify-center rounded-lg bg-kuningan-100 text-kuningan-700">
                  <Ikon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-bold text-tinta">{judul}</h3>
                <p className="mt-2 text-sm leading-relaxed text-redup">{isi}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="judul-harga"
        className="border-t border-garis bg-nada-50/60"
      >
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2
                id="judul-harga"
                className="font-serif text-3xl font-semibold text-nada-900 sm:text-4xl"
              >
                Mulai gratis, tingkatkan kapan saja
              </h2>
              <p className="mt-3 max-w-2xl text-redup">
                Paket Gratis sudah cukup untuk mulai berlatih. Buka semua materi
                dan analisis tanpa batas dengan Premium.
              </p>
            </div>
            <Button
              href="/harga"
              varian="garis"
              ikon={<ArrowRight className="size-4" aria-hidden="true" />}
              className="self-start lg:self-auto"
            >
              Lihat semua paket
            </Button>
          </div>
          <ul className="mt-10 grid gap-5 sm:grid-cols-3">
            {ringkasanHarga.map((r) => (
              <li
                key={r.nama}
                className="flex flex-col gap-1 rounded-2xl border border-garis bg-white p-6"
              >
                <p className="text-sm font-semibold text-redup">{r.nama}</p>
                <p className="font-serif text-3xl font-semibold text-nada-800">
                  {r.harga}
                  <span className="text-base font-normal text-redup">
                    {" "}
                    {r.satuan}
                  </span>
                </p>
                <p className="mt-1 text-sm text-tinta">{r.isi}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <AjakanDaftar />
    </>
  );
}
