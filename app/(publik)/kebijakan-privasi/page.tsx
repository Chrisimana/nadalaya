import type { Metadata } from "next";
import { DokumenLegal, type BagianLegal } from "@/components/publik/DokumenLegal";
import { EMAIL_KONTAK } from "@/lib/kontak";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description:
    "Cara Nadalaya mengumpulkan, menggunakan, dan melindungi data Anda. Rekaman suara diproses di perangkat dan tidak diunggah ke server.",
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
    id: "data-yang-dikumpulkan",
    judul: "Data yang kami kumpulkan",
    isi: (
      <>
        <p>Kami hanya mengumpulkan data yang diperlukan untuk menjalankan layanan:</p>
        <ul>
          <li>
            <strong>Data akun:</strong> nama dan alamat email yang Anda isi saat
            mendaftar, serta status paket dan masa aktifnya.
          </li>
          <li>
            <strong>Hasil latihan:</strong> materi yang dilatih, skor akurasi,
            tanggal latihan, dan ringkasan kontur nada hasil analisis.
          </li>
          <li>
            <strong>Catatan sesi analisis:</strong> waktu dan status setiap
            analisis, yang dipakai untuk menghitung kuota harian.
          </li>
          <li>
            <strong>Data transaksi:</strong> nomor pesanan, paket yang dibeli,
            nominal, metode pembayaran, dan status pembayaran.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "rekaman-suara",
    judul: "Rekaman suara dan mikrofon",
    isi: (
      <>
        <p>
          Rekaman suara Anda <strong>diproses langsung di perangkat Anda</strong>{" "}
          dan <strong>tidak diunggah ke server</strong> Nadalaya. Rekaman hanya
          disimpan sementara di memori browser selama Anda berada di halaman
          latihan, lalu dibuang saat Anda merekam ulang atau meninggalkan
          halaman. Yang dikirim ke server hanya hasil analisis berupa skor dan
          ringkasan kontur nada.
        </p>
        <p>
          Izin mikrofon hanya dipakai saat Anda menekan tombol Rekam. Mikrofon
          dilepas segera setelah perekaman berhenti. Anda dapat mencabut izin
          ini kapan saja melalui pengaturan situs di browser.
        </p>
      </>
    ),
  },
  {
    id: "pihak-ketiga",
    judul: "Layanan pihak ketiga",
    isi: (
      <>
        <p>Nadalaya menggunakan layanan berikut:</p>
        <ul>
          <li>
            <strong>Supabase</strong> untuk autentikasi akun dan penyimpanan
            data, termasuk berkas materi latihan.
          </li>
          <li>
            <strong>Midtrans</strong> untuk memproses pembayaran melalui Virtual
            Account dan QRIS. Data pembayaran Anda dimasukkan langsung di
            halaman Midtrans. Nadalaya <strong>tidak menyimpan</strong> data
            kartu maupun nomor rekening Anda.
          </li>
        </ul>
        <p>
          Model analisis nada (CREPE) diunduh ke browser Anda saat analisis
          pertama dan disimpan di cache browser. Proses ini tidak mengirim
          rekaman Anda ke mana pun.
        </p>
      </>
    ),
  },
  {
    id: "penggunaan-data",
    judul: "Penggunaan data",
    isi: (
      <>
        <p>Data Anda digunakan untuk:</p>
        <ul>
          <li>membuat dan mengelola akun serta sesi masuk;</li>
          <li>menghitung kuota analisis harian dan menentukan hak akses paket;</li>
          <li>menampilkan riwayat latihan dan grafik progres;</li>
          <li>memproses pembayaran dan mengaktifkan langganan;</li>
          <li>
            menyusun statistik penggunaan secara keseluruhan untuk meningkatkan
            layanan.
          </li>
        </ul>
        <p>Kami tidak menjual atau menyewakan data pribadi Anda kepada pihak lain.</p>
      </>
    ),
  },
  {
    id: "keamanan",
    judul: "Keamanan",
    isi: (
      <ul>
        <li>Seluruh komunikasi dengan server menggunakan koneksi terenkripsi (HTTPS).</li>
        <li>
          Kata sandi disimpan dalam bentuk ter-hash oleh Supabase Auth dan tidak
          pernah tersimpan sebagai teks biasa.
        </li>
        <li>
          Pengaturan keamanan basis data (Row Level Security) memastikan setiap
          pengguna hanya dapat membaca riwayat dan transaksinya sendiri.
        </li>
        <li>
          Notifikasi pembayaran dari Midtrans hanya diproses setelah tanda
          tangannya terverifikasi.
        </li>
      </ul>
    ),
  },
  {
    id: "hak-pengguna",
    judul: "Hak Anda",
    isi: (
      <ul>
        <li>Melihat dan mengubah nama melalui halaman Profil.</li>
        <li>Melihat status paket dan masa aktif langganan Anda.</li>
        <li>
          Meminta penghapusan akun beserta data latihan dengan mengirim email ke{" "}
          <TautanEmail /> dari alamat email yang terdaftar. Data transaksi dapat
          tetap kami simpan bila diperlukan untuk pencatatan pembayaran.
        </li>
      </ul>
    ),
  },
  {
    id: "kontak",
    judul: "Kontak",
    isi: (
      <p>
        Pertanyaan tentang kebijakan privasi ini dapat dikirim ke <TautanEmail />.
      </p>
    ),
  },
];

export default function HalamanKebijakanPrivasi() {
  return (
    <DokumenLegal
      judul="Kebijakan Privasi"
      diperbarui="17 Oktober 2026"
      pengantar={
        <p>
          Kebijakan ini menjelaskan data apa saja yang dikumpulkan Nadalaya,
          bagaimana data tersebut digunakan dan dilindungi, serta hak Anda atas
          data tersebut. Dengan menggunakan Nadalaya, Anda menyetujui kebijakan
          ini.
        </p>
      }
      bagian={bagian}
    />
  );
}
