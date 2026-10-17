import type { Metadata } from "next";
import { KartuHarga } from "@/components/beranda/KartuHarga";
import { AjakanDaftar } from "@/components/publik/AjakanDaftar";
import { DaftarFaq, type ItemFaq } from "@/components/publik/DaftarFaq";
import { KepalaHalaman } from "@/components/publik/KepalaHalaman";
import { TabelPerbandingan } from "@/components/publik/TabelPerbandingan";
import { DAFTAR_PAKET } from "@/lib/paket";

export const metadata: Metadata = {
  title: "Harga Paket",
  description:
    "Paket Gratis, Uji Coba Premium 7 hari, Premium Rp39.000/bulan, dan Paket Persiapan Tes Rp99.000/3 bulan.",
};

const faq: ItemFaq[] = [
  {
    tanya: "Apakah paket Gratis benar-benar gratis?",
    jawab:
      "Ya. Setiap akun baru otomatis memakai paket Gratis tanpa biaya dan tanpa batas waktu. Anda mendapat 3 analisis per hari untuk materi tangga nada dasar, dan setiap latihan tetap menampilkan skor serta grafik nada.",
  },
  {
    tanya: "Bagaimana cara kerja Uji Coba Premium?",
    jawab:
      "Pengguna Gratis dapat mengaktifkan Uji Coba Premium satu kali per akun. Selama 7 hari Anda mendapat semua fitur Premium tanpa membayar. Setelah 7 hari, akun otomatis kembali ke paket Gratis.",
  },
  {
    tanya: "Kapan kuota analisis harian diperbarui?",
    jawab:
      "Kuota paket Gratis diperbarui setiap hari pukul 00.00 WIB. Analisis yang gagal, misalnya karena rekaman kurang dari 2 detik atau suara tidak terdeteksi, tidak mengurangi kuota.",
  },
  {
    tanya: "Metode pembayaran apa saja yang tersedia?",
    jawab:
      "Pembayaran diproses melalui Midtrans dengan metode Virtual Account dan QRIS. Paket langsung aktif setelah pembayaran terkonfirmasi.",
  },
  {
    tanya: "Apakah langganan diperpanjang otomatis?",
    jawab:
      "Tidak. Setiap paket dibayar satu kali sesuai masa aktifnya. Jika Anda membeli paket lagi saat paket sebelumnya masih aktif, masa aktif baru ditambahkan ke sisa masa aktif yang ada.",
  },
  {
    tanya: "Apa yang terjadi setelah masa aktif berakhir?",
    jawab:
      "Akun otomatis kembali ke paket Gratis. Materi interval dan melodi, riwayat latihan, serta grafik progres kembali terkunci. Riwayat Anda tetap tersimpan dan dapat dilihat lagi saat paket Premium aktif kembali.",
  },
];

export default function HalamanHarga() {
  return (
    <>
      <KepalaHalaman judul="Mulai gratis, tingkatkan saat Anda siap">
        Semua paket memakai teknologi analisis nada yang sama. Perbedaannya ada
        pada kuota analisis harian, pilihan materi, dan grafik progres.
      </KepalaHalaman>

      <section aria-labelledby="judul-paket">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-16">
          <h2 id="judul-paket" className="sr-only">
            Pilihan paket
          </h2>
          <div className="grid gap-6 pt-3 sm:grid-cols-2 lg:grid-cols-4">
            {DAFTAR_PAKET.map((paket) => (
              <KartuHarga key={paket.kode} paket={paket} />
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-redup">
            Pembayaran paket berbayar melalui Virtual Account atau QRIS.
          </p>
        </div>
      </section>

      <section
        aria-labelledby="judul-perbandingan"
        className="border-y border-garis bg-white"
      >
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-16">
          <h2
            id="judul-perbandingan"
            className="font-serif text-3xl font-semibold text-nada-900"
          >
            Perbandingan hak akses
          </h2>
          <p className="mt-3 max-w-2xl text-redup">
            Uji Coba Premium dan Paket Persiapan Tes memiliki hak akses yang
            sama dengan Premium. Yang berbeda hanya masa aktifnya.
          </p>
          <div className="mt-8">
            <TabelPerbandingan />
          </div>
        </div>
      </section>

      <section aria-labelledby="judul-faq">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:py-16">
          <h2
            id="judul-faq"
            className="font-serif text-3xl font-semibold text-nada-900"
          >
            Pertanyaan yang sering diajukan
          </h2>
          <div className="mt-8">
            <DaftarFaq daftar={faq} />
          </div>
        </div>
      </section>

      <AjakanDaftar
        judul="Coba dulu, tanpa biaya"
        deskripsi="Daftar gratis dan dapatkan 3 analisis setiap hari."
      />
    </>
  );
}
