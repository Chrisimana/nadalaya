import type { Metadata } from "next";
import Link from "next/link";
import { DokumenLegal, type BagianLegal } from "@/components/publik/DokumenLegal";
import { EMAIL_KONTAK } from "@/lib/kontak";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan",
  description:
    "Ketentuan penggunaan Nadalaya: akun, paket dan kuota, pembayaran, pengembalian dana, dan batasan layanan.",
};

const TautanEmail = () => (
  <a
    href={`mailto:${EMAIL_KONTAK}`}
    className="font-semibold text-nada-700 underline underline-offset-4"
  >
    {EMAIL_KONTAK}
  </a>
);

const bagian: BagianLegal[] = [
  {
    id: "ketentuan-umum",
    judul: "Ketentuan umum",
    isi: (
      <p>
        Nadalaya adalah website latihan vokal solfeggio yang menilai akurasi
        nada nyanyian terhadap acuan MIDI. Dengan mendaftar atau menggunakan
        Nadalaya, Anda menyetujui syarat dan ketentuan ini beserta{" "}
        <Link
          href="/kebijakan-privasi"
          className="font-semibold text-nada-700 underline underline-offset-4"
        >
          Kebijakan Privasi
        </Link>
        . Jika tidak setuju, mohon untuk tidak menggunakan layanan ini.
      </p>
    ),
  },
  {
    id: "akun",
    judul: "Akun",
    isi: (
      <ul>
        <li>Setiap orang hanya boleh memiliki satu akun.</li>
        <li>
          Anda wajib mengisi data yang benar dan memverifikasi alamat email
          sebelum dapat masuk.
        </li>
        <li>
          Anda bertanggung jawab menjaga kerahasiaan kata sandi dan seluruh
          aktivitas yang terjadi melalui akun Anda.
        </li>
        <li>
          Admin Nadalaya dapat menonaktifkan akun yang melanggar ketentuan ini,
          misalnya membuat akun ganda untuk memperoleh kuota atau uji coba
          tambahan. Akun yang dinonaktifkan tidak dapat masuk ke sistem.
        </li>
      </ul>
    ),
  },
  {
    id: "paket-dan-kuota",
    judul: "Paket dan kuota",
    isi: (
      <>
        <ul>
          <li>
            <strong>Gratis:</strong> 3 analisis per hari dan materi tangga nada
            dasar. Kuota diperbarui setiap hari pukul 00.00 WIB.
          </li>
          <li>
            <strong>Premium:</strong> Rp39.000 per bulan (30 hari), dengan
            analisis tanpa batas dan akses ke semua materi.
          </li>
          <li>
            <strong>Paket Persiapan Tes:</strong> Rp99.000 untuk 3 bulan (90
            hari), dengan hak akses setara Premium.
          </li>
          <li>
            <strong>Uji Coba Premium:</strong> gratis selama 7 hari dengan hak
            akses setara Premium, dan hanya dapat diaktifkan satu kali per akun.
          </li>
        </ul>
        <p>
          Hanya analisis yang berhasil yang dihitung sebagai kuota. Analisis
          yang gagal, misalnya karena rekaman kurang dari 2 detik, tidak ada
          suara, atau model analisis gagal dimuat, tidak mengurangi kuota.
        </p>
        <p>
          Setelah masa aktif paket berbayar atau uji coba berakhir, akun
          otomatis kembali ke paket Gratis.
        </p>
      </>
    ),
  },
  {
    id: "riwayat-dan-progres",
    judul: "Riwayat latihan dan grafik progres",
    isi: (
      <p>
        Skor dan grafik nada ditampilkan setiap selesai latihan untuk semua
        paket. Riwayat latihan dan grafik progres hanya dapat dilihat oleh
        pengguna Premium, Paket Persiapan Tes, dan Uji Coba Premium yang masih
        aktif. Riwayat tetap tersimpan saat paket berakhir dan dapat dilihat
        kembali ketika paket Premium aktif lagi.
      </p>
    ),
  },
  {
    id: "pembayaran",
    judul: "Pembayaran",
    isi: (
      <ul>
        <li>
          Pembayaran diproses melalui Midtrans dengan metode Virtual Account dan
          QRIS.
        </li>
        <li>
          Langganan aktif setelah pembayaran terkonfirmasi oleh Midtrans.
          Pesanan yang tidak dibayar hingga batas waktu akan kedaluwarsa.
        </li>
        <li>
          Langganan tidak diperpanjang secara otomatis. Jika Anda membeli paket
          saat paket sebelumnya masih aktif, masa aktif baru ditambahkan ke sisa
          masa aktif yang ada.
        </li>
      </ul>
    ),
  },
  {
    id: "pengembalian-dana",
    judul: "Kebijakan pengembalian dana",
    isi: (
      <>
        <p>
          Karena paket langsung aktif setelah pembayaran terkonfirmasi,
          pembayaran yang sudah berhasil pada dasarnya tidak dapat dikembalikan.
          Kami menyarankan Anda mencoba Uji Coba Premium terlebih dahulu
          sebelum membeli.
        </p>
        <p>
          Pengecualian berlaku bila terjadi kesalahan dari pihak kami, misalnya
          pembayaran tertagih lebih dari satu kali atau paket tidak aktif
          setelah pembayaran berhasil. Kirim email ke <TautanEmail /> paling
          lambat 7 hari setelah pembayaran, sertakan nomor pesanan, dan kami
          akan memeriksanya.
        </p>
      </>
    ),
  },
  {
    id: "batasan-layanan",
    judul: "Batasan layanan",
    isi: (
      <ul>
        <li>
          Skor akurasi bergantung pada kualitas mikrofon, kebisingan ruangan,
          dan spesifikasi perangkat. Gunakan headphone dan ruangan yang tenang
          untuk hasil terbaik.
        </li>
        <li>
          Penilaian hanya mencakup ketepatan nada dan urutannya. Ritme, kualitas
          suara, dan teknik vokal tidak dinilai.
        </li>
        <li>
          Nadalaya adalah alat bantu latihan dan{" "}
          <strong>bukan pengganti penilaian pengajar</strong> maupun hasil tes
          keterampilan musik yang sebenarnya.
        </li>
        <li>
          Layanan dapat sesekali tidak tersedia karena pemeliharaan atau
          gangguan dari penyedia layanan pihak ketiga.
        </li>
      </ul>
    ),
  },
  {
    id: "perubahan-ketentuan",
    judul: "Perubahan ketentuan",
    isi: (
      <p>
        Kami dapat memperbarui syarat dan ketentuan ini sewaktu-waktu. Tanggal
        pembaruan terakhir selalu tercantum di bagian atas halaman ini. Dengan
        tetap menggunakan Nadalaya setelah perubahan, Anda dianggap menyetujui
        ketentuan yang baru.
      </p>
    ),
  },
  {
    id: "kontak",
    judul: "Kontak",
    isi: (
      <p>
        Pertanyaan tentang syarat dan ketentuan ini dapat dikirim ke{" "}
        <TautanEmail />.
      </p>
    ),
  },
];

export default function HalamanSyaratKetentuan() {
  return (
    <DokumenLegal
      judul="Syarat & Ketentuan"
      diperbarui="17 Oktober 2026"
      pengantar={
        <p>
          Syarat dan ketentuan ini mengatur penggunaan website Nadalaya,
          termasuk akun, paket langganan, pembayaran, dan batasan layanan.
          Mohon baca dengan saksama sebelum menggunakan layanan.
        </p>
      }
      bagian={bagian}
    />
  );
}
