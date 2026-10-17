import {
  AudioWaveform,
  Info,
  Cpu,
  GraduationCap,
  Mic,
  ShieldCheck,
  Target,
  Waypoints,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { AjakanDaftar } from "@/components/publik/AjakanDaftar";
import { KepalaHalaman } from "@/components/publik/KepalaHalaman";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Tentang",
  description:
    "Nadalaya adalah website latihan solfeggio yang menilai akurasi nada nyanyian dengan CREPE dan Dynamic Time Warping langsung di browser.",
};

const tahapAnalisis: { ikon: LucideIcon; judul: string; isi: string }[] = [
  {
    ikon: Mic,
    judul: "Rekaman di browser",
    isi: "Nyanyian direkam melalui mikrofon langsung di browser, maksimal 60 detik.",
  },
  {
    ikon: AudioWaveform,
    judul: "Deteksi nada dengan CREPE",
    isi: "Model deep learning CREPE (TensorFlow.js) membaca tinggi nada setiap potongan rekaman beserta tingkat keyakinannya. Bagian tanpa suara diabaikan.",
  },
  {
    ikon: Waypoints,
    judul: "Penyelarasan dengan DTW",
    isi: "Nada dikonversi ke satuan cent, lalu Dynamic Time Warping menyelaraskannya dengan acuan MIDI. Bernyanyi sedikit lebih cepat atau lambat tidak mengurangi skor.",
  },
  {
    ikon: Target,
    judul: "Skor dan umpan balik",
    isi: "Sistem menghitung skor akurasi 0–100, menampilkan grafik nada, dan menandai nada yang meleset lebih dari 50 cent.",
  },
];

const untukSiapa = [
  "Calon mahasiswa jurusan musik yang akan menghadapi tes keterampilan musik bagian solfeggio.",
  "Siapa pun yang ingin melatih kemampuan membaca notasi dan menyanyikan nada dengan tepat.",
  "Pelajar yang berlatih mandiri tanpa pendamping dan membutuhkan umpan balik yang objektif.",
];

const batasan = [
  "Penilaian berfokus pada ketepatan nada dan urutannya. Ritme, kualitas suara, dan teknik vokal tidak dinilai.",
  "Rekaman berupa satu suara (monofonik) dari mikrofon pengguna.",
  "Materi terbatas pada tangga nada, interval, dan melodi pendek.",
  "Hasil dipengaruhi kualitas mikrofon dan kebisingan ruangan. Gunakan headphone dan ruangan yang tenang.",
];

export default function HalamanTentang() {
  return (
    <>
      <KepalaHalaman
        judul="Teman latihan solfeggio yang memberi umpan balik objektif"
      >
        Nadalaya membantu Anda berlatih membaca notasi dan menyanyikannya
        dengan nada yang tepat, lalu menunjukkan secara jelas nada mana yang
        sudah tepat dan mana yang meleset.
      </KepalaHalaman>

      {/* Apa itu dan untuk siapa */}
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-16">
        <div>
          <h2 className="font-serif text-3xl font-semibold text-nada-900">
            Apa itu Nadalaya?
          </h2>
          <div className="mt-4 flex flex-col gap-4 leading-relaxed text-redup">
            <p>
              Bagian solfeggio pada tes keterampilan musik menuntut ketepatan
              nada yang biasanya hanya dapat dinilai oleh telinga terlatih.
              Tanpa pendamping, sulit mengetahui apakah nyanyian sudah tepat,
              terlalu tinggi, atau terlalu rendah, dan seberapa jauh
              selisihnya.
            </p>
            <p>
              Nadalaya menjawab masalah itu. Anda memilih materi, mendengarkan
              acuan MIDI sambil membaca notasi balok, lalu merekam nyanyian.
              Dalam hitungan detik Anda mendapat skor akurasi dan grafik yang
              membandingkan nada Anda dengan acuan.
            </p>
          </div>
        </div>
        <Card className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-nada-700 text-white">
              <GraduationCap className="size-5" aria-hidden="true" />
            </span>
            <h2 className="text-lg font-bold text-tinta">Untuk siapa?</h2>
          </div>
          <ul className="flex flex-col gap-3">
            {untukSiapa.map((teks) => (
              <li key={teks} className="flex gap-3 text-sm leading-relaxed text-tinta">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-kuningan-400" />
                {teks}
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* Cara kerja teknologi */}
      <section
        aria-labelledby="judul-teknologi"
        className="border-y border-garis bg-white"
      >
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-16">
          <h2
            id="judul-teknologi"
            className="font-serif text-3xl font-semibold text-nada-900"
          >
            Cara kerja teknologinya
          </h2>
          <p className="mt-3 max-w-2xl text-redup">
            Seluruh analisis berjalan di browser Anda dalam empat tahap.
          </p>
          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {tahapAnalisis.map(({ ikon: Ikon, judul, isi }, i) => (
              <li key={judul} className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-kuningan-100 text-kuningan-700">
                    <Ikon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="font-serif text-2xl font-semibold text-nada-300">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="font-bold text-tinta">{judul}</h3>
                <p className="text-sm leading-relaxed text-redup">{isi}</p>
              </li>
            ))}
          </ol>

          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            <div className="flex gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
              <ShieldCheck
                className="size-6 shrink-0 text-emerald-700"
                aria-hidden="true"
              />
              <div>
                <h3 className="font-bold text-emerald-900">
                  Rekaman tidak diunggah ke server
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-emerald-900">
                  Suara Anda hanya disimpan sementara di browser dan dianalisis
                  di perangkat Anda sendiri. Yang disimpan ke server hanya hasil
                  analisis, yaitu skor dan ringkasan kontur nada, untuk riwayat
                  latihan.
                </p>
              </div>
            </div>
            <div className="flex gap-4 rounded-2xl border border-garis bg-krem p-6">
              <Cpu className="size-6 shrink-0 text-nada-600" aria-hidden="true" />
              <div>
                <h3 className="font-bold text-tinta">Tanpa perangkat khusus</h3>
                <p className="mt-2 text-sm leading-relaxed text-redup">
                  Cukup laptop atau ponsel dengan mikrofon dan browser terbaru
                  (Chrome, Edge, atau Firefox). Model analisis diunduh sekali
                  saat analisis pertama, lalu disimpan di cache browser.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Batasan */}
      <section aria-labelledby="judul-batasan">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-16">
          <h2
            id="judul-batasan"
            className="font-serif text-3xl font-semibold text-nada-900"
          >
            Yang perlu Anda ketahui
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {batasan.map((teks) => (
              <li
                key={teks}
                className="flex gap-3 rounded-xl border border-garis bg-white p-4 text-sm leading-relaxed text-tinta"
              >
                <Info
                  className="mt-0.5 size-4 shrink-0 text-redup"
                  aria-hidden="true"
                />
                {teks}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Pengembang */}
      <section
        aria-labelledby="judul-pengembang"
        className="border-t border-garis bg-nada-50/60"
      >
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-16">
          <h2
            id="judul-pengembang"
            className="font-serif text-3xl font-semibold text-nada-900"
          >
            Pengembang
          </h2>
          <Card className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
            <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-nada-700 font-serif text-2xl font-semibold text-white">
              CA
            </span>
            <div className="flex flex-col gap-1">
              <p className="text-lg font-bold text-tinta">
                Christian Imanuel Admojo
              </p>
              <p className="text-sm text-redup">11241022 · Informatika</p>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-redup">
                Nadalaya dikembangkan sebagai tugas besar dengan judul{" "}
                <em>
                  Website Melatih Vokal untuk Persiapan Tes Keterampilan Musik
                  Menggunakan CREPE dan Dynamic Time Warping
                </em>
                . Aplikasi dibangun dengan Next.js, Supabase, TensorFlow.js,
                dan Midtrans.
              </p>
            </div>
          </Card>
        </div>
      </section>

      <AjakanDaftar />
    </>
  );
}
