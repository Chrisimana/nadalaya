# Nadalaya

Website latihan vokal **solfeggio** untuk persiapan tes keterampilan musik. Pengguna memilih materi (tangga nada, interval, atau melodi pendek), mendengarkan acuan MIDI sambil membaca notasi balok, lalu merekam nyanyiannya langsung dari browser. Sistem menilai akurasi nada memakai **CREPE** (deteksi pitch, TensorFlow.js) dan **Dynamic Time Warping** (penyelarasan dengan acuan). Hasilnya berupa skor 0–100, grafik pitch nyanyian dibandingkan acuan, dan daftar nada yang meleset lebih dari 50 cent.

Rekaman suara diproses di perangkat pengguna dan **tidak diunggah ke server** (NFR-07). Yang disimpan hanya hasil analisis.

Acuan dokumen: [SRS](docs/SRS_11241022.pdf) dan [SDD](docs/SDD%20_11241022.pdf) di folder `docs/`.

## Status proyek

**Langkah 1 – front-end (progres 30%).** Back-end (Supabase), mesin analisis CREPE + DTW, dan pembayaran Midtrans dikerjakan pada tahap berikutnya.

Proyek ini tidak memakai data dummy. Halaman yang membutuhkan data menampilkan keadaan kosong. Semua fungsi pengambilan data di `lib/api/` belum tersambung ke server: fungsi itu mengembalikan hasil kosong atau melempar `BelumTersambungError`, yang ditangani UI dengan pesan "Belum tersambung ke server." Setiap fungsi ditandai `// TODO: sambungkan ke Supabase`.

## Teknologi

| Bagian | Teknologi |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack, Cache Components) + React 19 |
| Bahasa & gaya | TypeScript, Tailwind CSS 4 |
| Notasi balok | VexFlow 5 (font Bravura dibundel) |
| Pemutaran acuan | Tone.js |
| Perekaman | Web Audio API + MediaRecorder |
| Grafik | Chart.js + react-chartjs-2 |
| Ikon | lucide-react |
| Rencana tahap berikutnya | Supabase (Auth, PostgreSQL, Storage), CREPE (TensorFlow.js), @tonejs/midi, Midtrans Snap, Docker |

## Cara menjalankan

Prasyarat: Node.js 20 atau lebih baru dan npm.

```bash
npm install
npm run dev
```

Buka <http://localhost:3000>.

| Perintah | Kegunaan |
|---|---|
| `npm run dev` | Server pengembangan |
| `npm run build` | Build produksi |
| `npm run start` | Menjalankan hasil build |
| `npm run lint` | Pemeriksaan ESLint |

## Mencoba tampilan tanpa akun

Login dan pendaftaran **belum dapat dipakai** karena Supabase belum tersambung. Menekan tombol Masuk atau Daftar hanya menampilkan pesan "Belum tersambung ke server". Tidak ada akun uji coba.

Semua halaman, termasuk halaman pengguna dan admin, **belum dilindungi login**. Jadi setiap halaman dapat dibuka langsung dengan mengetik alamatnya di browser. Jalankan `npm run dev`, lalu buka alamat berikut.

### Halaman publik

| Halaman | Alamat |
|---|---|
| Beranda | <http://localhost:3000/> |
| Harga | <http://localhost:3000/harga> |
| Tentang | <http://localhost:3000/tentang> |
| Kebijakan Privasi | <http://localhost:3000/kebijakan-privasi> |
| Syarat & Ketentuan | <http://localhost:3000/syarat-ketentuan> |

### Halaman autentikasi

| Halaman | Alamat | Catatan |
|---|---|---|
| Masuk | <http://localhost:3000/masuk> | Validasi form berjalan; kirim menampilkan pesan belum tersambung |
| Daftar | <http://localhost:3000/daftar> | Coba kata sandi kurang dari 8 karakter untuk melihat validasi |
| Lupa Kata Sandi | <http://localhost:3000/lupa-kata-sandi> | |
| Atur Ulang Kata Sandi | <http://localhost:3000/atur-ulang-kata-sandi> | Tampilan tautan kedaluwarsa: <http://localhost:3000/atur-ulang-kata-sandi?error_code=otp_expired> |
| Verifikasi Email | <http://localhost:3000/verifikasi-email?email=contoh@email.com> | Parameter `email` mengisi alamat yang ditampilkan |

### Halaman pengguna (seolah-olah sudah masuk)

| Halaman | Alamat | Catatan |
|---|---|---|
| Dashboard | <http://localhost:3000/dashboard> | Menu akun dan Keluar (dengan dialog konfirmasi) ada di kanan atas |
| Materi | <http://localhost:3000/materi> | Menampilkan "Belum ada materi" |
| Latihan | <http://localhost:3000/latihan/coba> | Bagian akhir `coba` boleh diganti apa saja. **Perekam suara berfungsi penuh** |
| Riwayat | <http://localhost:3000/riwayat> | Menampilkan ajakan upgrade karena paket bawaan Gratis |
| Detail Riwayat | <http://localhost:3000/riwayat/coba> | |
| Grafik Progres | <http://localhost:3000/progres> | Menampilkan ajakan upgrade karena paket bawaan Gratis |
| Langganan | <http://localhost:3000/langganan> | |
| Profil | <http://localhost:3000/profil> | |

**Status Pembayaran.** Tampilannya ditentukan lewat parameter alamat:

| Status | Alamat |
|---|---|
| Berhasil | <http://localhost:3000/langganan/status?order_id=NDL-001&status=berhasil> |
| Tertunda | <http://localhost:3000/langganan/status?order_id=NDL-001&status=tertunda> |
| Gagal | <http://localhost:3000/langganan/status?order_id=NDL-001&status=gagal> |
| Kedaluwarsa | <http://localhost:3000/langganan/status?order_id=NDL-001&status=kedaluwarsa> |

### Halaman admin

| Halaman | Alamat |
|---|---|
| Dashboard Admin | <http://localhost:3000/admin> |
| Kelola Materi | <http://localhost:3000/admin/materi> |
| Tambah Materi | <http://localhost:3000/admin/materi/tambah> |
| Ubah Materi | <http://localhost:3000/admin/materi/coba/ubah> (menampilkan "Materi tidak ditemukan" sampai data tersedia) |
| Kelola Pengguna | <http://localhost:3000/admin/pengguna> |
| Detail Pengguna | <http://localhost:3000/admin/pengguna/coba> (menampilkan "Pengguna tidak ditemukan" sampai data tersedia) |
| Statistik Latihan | <http://localhost:3000/admin/statistik> |
| Laporan Transaksi | <http://localhost:3000/admin/transaksi> |

Halaman 404 dapat dilihat dengan membuka alamat yang tidak ada, misalnya <http://localhost:3000/tidak-ada>.

### Mencoba perekam suara

Akses mikrofon hanya diizinkan pada koneksi aman, yaitu `localhost` atau HTTPS. Buka <http://localhost:3000/latihan/coba>, tekan tombol Rekam, lalu izinkan mikrofon. Hal yang dapat dicoba:

1. Batang indikator level bergerak saat Anda bersuara.
2. Berhenti sebelum 2 detik akan memunculkan pesan "Rekaman terlalu pendek".
3. Dengarkan Ulang memutar rekaman, dan Rekam Ulang mengosongkannya.
4. Menolak izin mikrofon akan memunculkan petunjuk cara mengizinkannya.
5. Perekaman berhenti otomatis pada 60 detik.

Rekaman hanya disimpan sementara di browser dan tidak dikirim ke mana pun. Tombol Analisis saat ini berhenti di langkah "Memeriksa kuota" dengan pesan belum tersambung ke server.

> Setelah Supabase tersambung, halaman pengguna dan admin akan dilindungi middleware sehingga hanya dapat dibuka setelah masuk dengan peran yang sesuai.

## Struktur folder

```
app/
├─ layout.tsx                Pengaturan umum saja: font, metadata, html/body
├─ (publik)/                 Navbar publik + footer 3 kolom
│  ├─ page.tsx               Beranda: produk, cara kerja, fitur, ringkasan harga
│  ├─ harga/                 Kartu paket, perbandingan hak akses, FAQ
│  ├─ tentang/               Tentang Nadalaya, teknologi, privasi, pengembang
│  ├─ kebijakan-privasi/     Kebijakan privasi
│  └─ syarat-ketentuan/      Syarat & ketentuan
├─ (auth)/                   Tampilan fokus tanpa navbar dan footer
│  ├─ masuk/  daftar/        Login (UC-02) dan registrasi (UC-01)
│  ├─ lupa-kata-sandi/       Form email tautan atur ulang (UC-03)
│  ├─ atur-ulang-kata-sandi/ Kata sandi baru dari tautan email (UC-03)
│  └─ verifikasi-email/      Informasi setelah daftar + kirim ulang (UC-01)
├─ (pengguna)/               Header aplikasi + bilah menu bawah di ponsel, tanpa footer
│  ├─ dashboard/             Dashboard pengguna
│  ├─ materi/                Daftar materi (UC-06, UC-07)
│  ├─ latihan/[id]/          Latihan: acuan, rekam, analisis, hasil (UC-08 s.d. UC-13)
│  ├─ riwayat/  riwayat/[id] Riwayat dan detail, khusus Premium (UC-14)
│  ├─ progres/               Grafik progres, khusus Premium (UC-15)
│  ├─ langganan/             Paket, uji coba, pembelian (UC-16, UC-17)
│  ├─ langganan/status/      Status pembayaran (UC-18)
│  └─ profil/                Profil (UC-05)
├─ (admin)/admin/            Sidebar admin, tanpa footer (TODO: middleware peran admin)
│  ├─ page.tsx               Dashboard admin
│  ├─ materi/                Kelola, tambah, ubah, hapus materi (UC-20 s.d. UC-23)
│  ├─ pengguna/              Kelola dan detail pengguna (UC-24, UC-25)
│  ├─ statistik/             Statistik latihan (UC-26)
│  └─ transaksi/             Laporan transaksi (UC-27)
└─ api/                      Route handler (tahap berikutnya)
components/
├─ ui/                       Button, Input, Pilihan, KolomCari, Card, Alert, AlertServer, EmptyState,
│                            Badge, Spinner, Memuat/Kerangka/GagalMuat, DialogKonfirmasi
├─ Logo.tsx                  Logo Nadalaya (public/nadalaya-logo.svg)
├─ layout/                   Navbar publik, Footer, HeaderAplikasi, MenuPengguna (Profil, Keluar)
├─ publik/                   KepalaHalaman, AjakanDaftar, TabelPerbandingan, DaftarFaq, DokumenLegal
├─ auth/  beranda/  dashboard/  materi/  riwayat/  progres/  pengguna/
├─ akses/                    MateriTerkunci (FR-08), KuotaHabis (FR-09), AjakanUpgrade, KhususPremium
├─ admin/                    SidebarAdmin, tabel kelola, FormMateri, dialog, grafik statistik
└─ latihan/                  PanelNotasi, PanelAcuan, PerekamSuara, PanelAnalisis, hasil/
lib/
├─ api/                      Lapisan data (belum tersambung, ditandai TODO): auth, materi,
│                            akses, riwayat, paket/langganan, admin
├─ audio/                    recorder.ts, usePerekam.ts, acuan.ts (Tone.js), nada.ts,
│                            analisis.ts, useAnalisis.ts, crepe.ts (stub)
├─ types.ts                  Tipe data mengikuti rancangan basis data SDD
├─ useMuat.ts                Hook memuat data dari lib/api (memuat, galat, siap)
├─ validasi.ts  waktu.ts  paket.ts  kontak.ts  utils.ts
docs/                        SRS dan SDD
```

## Progres fitur (27 use case)

> **Keputusan terbaru:** riwayat latihan hanya dapat dilihat pengguna Premium (termasuk Uji Coba). Pengguna Gratis tetap mendapat skor dan grafik nada setiap selesai latihan. Ketentuan ini berbeda dari SRS Tabel 2.3 versi 1.1.

Keterangan status:

- <img src="docs/ikon/berfungsi.svg" width="16" height="16" alt="Berfungsi penuh"> **Berfungsi penuh**: bekerja tanpa back-end.
- <img src="docs/ikon/tampilan.svg" width="16" height="16" alt="Tampilan selesai"> **Tampilan selesai**: UI dan alur sudah lengkap, menunggu back-end atau mesin analisis.
- <img src="docs/ikon/belum.svg" width="16" height="16" alt="Belum dikerjakan"> **Belum dikerjakan**.

| No | Use Case | FR | Status | Keterangan |
|---|---|---|---|---|
| UC-01 | Mendaftar Akun | FR-01 | <img src="docs/ikon/tampilan.svg" width="16" height="16" alt="Tampilan selesai"> | Form nama, email, kata sandi dengan validasi klien. Setelah berhasil diarahkan ke `/verifikasi-email` (info + kirim ulang email). |
| UC-02 | Masuk ke Sistem | FR-02 | <img src="docs/ikon/tampilan.svg" width="16" height="16" alt="Tampilan selesai"> | Form email dan kata sandi, tautan Lupa kata sandi, pengalihan sesuai peran sudah disiapkan. |
| UC-03 | Mengatur Ulang Kata Sandi | FR-03 | <img src="docs/ikon/tampilan.svg" width="16" height="16" alt="Tampilan selesai"> | `/lupa-kata-sandi` (form email, pesan tautan terkirim) dan `/atur-ulang-kata-sandi` (kata sandi baru + konfirmasi min. 8 karakter, tampilan tautan kedaluwarsa). |
| UC-04 | Keluar dari Sistem | FR-02 | <img src="docs/ikon/tampilan.svg" width="16" height="16" alt="Tampilan selesai"> | Menu Keluar di header pengguna dan sidebar admin dengan dialog konfirmasi. Tetap diarahkan ke beranda bila server gagal dihubungi. |
| UC-05 | Mengubah Profil | FR-04 | <img src="docs/ikon/tampilan.svg" width="16" height="16" alt="Tampilan selesai"> | `/profil`: form ubah nama, email (tidak dapat diubah), status paket dan masa aktif, tautan ke Langganan. |
| UC-06 | Melihat Daftar Materi | FR-07 | <img src="docs/ikon/tampilan.svg" width="16" height="16" alt="Tampilan selesai"> | Pengelompokan per jenis dan tingkat, ikon gembok materi premium, keadaan kosong, memuat, dan gagal (Muat Ulang). |
| UC-07 | Menyaring Materi | FR-07 | <img src="docs/ikon/tampilan.svg" width="16" height="16" alt="Tampilan selesai"> | Chip saring jenis dan tingkat, pesan "Materi tidak ditemukan". Di luar 10 fitur target. |
| UC-08 | Memilih Materi Latihan | FR-07, FR-08 | <img src="docs/ikon/tampilan.svg" width="16" height="16" alt="Tampilan selesai"> | Navigasi kartu materi ke `/latihan/[id]` berfungsi. Data materi menunggu server. |
| UC-09 | Memeriksa Hak Akses dan Kuota | FR-08, FR-09 | <img src="docs/ikon/tampilan.svg" width="16" height="16" alt="Tampilan selesai"> | Komponen materi terkunci (ajakan upgrade) dan kuota habis (waktu reset 00.00 WIB + hitung mundur). Logika dari server. |
| UC-10 | Memutar Acuan MIDI dan Notasi | FR-10 | <img src="docs/ikon/tampilan.svg" width="16" height="16" alt="Tampilan selesai"> | Notasi VexFlow dan pemutar Tone.js menerima data lewat props, termasuk penanda not aktif. Pembacaan berkas MIDI menunggu Storage. |
| UC-11 | Merekam Suara | FR-10, FR-11 | <img src="docs/ikon/berfungsi.svg" width="16" height="16" alt="Berfungsi penuh"> | Izin mikrofon, rekam/berhenti, indikator level, timer, berhenti otomatis 60 detik, Dengarkan Ulang, Rekam Ulang, pesan izin ditolak, pesan rekaman < 2 detik atau tanpa suara. Acuan dihentikan saat merekam. Rekaman tidak diunggah. |
| UC-12 | Menganalisis Akurasi Nada | FR-09, FR-12, FR-13 | <img src="docs/ikon/tampilan.svg" width="16" height="16" alt="Tampilan selesai"> | Tombol Analisis, status proses (kuota, model, analisis), pesan gagal (model, nada tidak terdeteksi, kuota habis), pembatalan sesi. Mesin CREPE + DTW di tahap berikutnya. |
| UC-13 | Menampilkan Skor dan Grafik Nada | FR-14, FR-15, FR-16 | <img src="docs/ikon/tampilan.svg" width="16" height="16" alt="Tampilan selesai"> | Skor 0–100, grafik pitch Chart.js, tabel alternatif, daftar nada meleset > 50 cent, Latih Lagi, Kembali ke Daftar Materi. Data lewat props. |
| UC-14 | Melihat Riwayat Latihan | FR-16 | <img src="docs/ikon/tampilan.svg" width="16" height="16" alt="Tampilan selesai"> | Khusus Premium dan Uji Coba (Gratis melihat `AjakanUpgrade`). Tabel materi, skor, tanggal; klik baris membuka detail `/riwayat/[id]` dengan skor, grafik nada, dan nada meleset. |
| UC-15 | Melihat Grafik Progres | FR-17 | <img src="docs/ikon/tampilan.svg" width="16" height="16" alt="Tampilan selesai"> | `/progres` khusus Premium: grafik skor per jenis materi (Chart.js, palet tervalidasi), ringkasan, pesan "Data belum cukup". |
| UC-16 | Mengaktifkan Uji Coba Premium | FR-18 | <img src="docs/ikon/tampilan.svg" width="16" height="16" alt="Tampilan selesai"> | Tombol "Coba Premium 7 Hari" di `/langganan` (hanya untuk Gratis yang belum pernah uji coba) dan di ajakan upgrade. |
| UC-17 | Membeli Paket Langganan | FR-19 | <img src="docs/ikon/tampilan.svg" width="16" height="16" alt="Tampilan selesai"> | `/langganan`: status paket, kartu Premium dan Paket Persiapan Tes dengan tombol Bayar, keterangan VA dan QRIS. |
| UC-18 | Memproses Pembayaran | FR-19, FR-20 | <img src="docs/ikon/tampilan.svg" width="16" height="16" alt="Tampilan selesai"> | `/langganan/status`: tampilan berhasil, tertunda, gagal, kedaluwarsa (dari `getTransaksi()` atau parameter Midtrans) dan ringkasan transaksi. Pop-up Snap menunggu integrasi. |
| UC-19 | Mengaktifkan Langganan | FR-20, FR-21 | <img src="docs/ikon/belum.svg" width="16" height="16" alt="Belum dikerjakan"> | Proses server (webhook Midtrans). Hasilnya tampil di Status Pembayaran dan Langganan. |
| UC-20 | Melihat Data Materi (admin) | FR-05 | <img src="docs/ikon/tampilan.svg" width="16" height="16" alt="Tampilan selesai"> | `/admin/materi`: tabel materi, pencarian, filter jenis dan tingkat, empty state dengan tombol Tambah Materi. |
| UC-21 | Menambahkan Data Materi | FR-05 | <img src="docs/ikon/tampilan.svg" width="16" height="16" alt="Tampilan selesai"> | `/admin/materi/tambah`: judul, jenis, tingkat, gratis/premium, tempo, unggah `.mid` (validasi ekstensi, nama berkas tampil). |
| UC-22 | Mengubah Data Materi | FR-05 | <img src="docs/ikon/tampilan.svg" width="16" height="16" alt="Tampilan selesai"> | `/admin/materi/[id]/ubah`: form yang sama dengan opsi ganti berkas; berkas lama tetap dipakai jika tidak diganti. |
| UC-23 | Menghapus Data Materi | FR-05 | <img src="docs/ikon/tampilan.svg" width="16" height="16" alt="Tampilan selesai"> | Dialog konfirmasi yang menjelaskan materi yang sudah dipakai latihan dinonaktifkan, bukan dihapus. |
| UC-24 | Melihat Data Pengguna | FR-06 | <img src="docs/ikon/tampilan.svg" width="16" height="16" alt="Tampilan selesai"> | `/admin/pengguna`: tabel, pencarian nama/email, filter status paket; detail `/admin/pengguna/[id]`. |
| UC-25 | Menonaktifkan Akun Pengguna | FR-06 | <img src="docs/ikon/tampilan.svg" width="16" height="16" alt="Tampilan selesai"> | Tombol Nonaktifkan di tabel dan detail dengan dialog konfirmasi. |
| UC-26 | Melihat Statistik Latihan | FR-22 | <img src="docs/ikon/tampilan.svg" width="16" height="16" alt="Tampilan selesai"> | `/admin/statistik`: filter rentang tanggal, jumlah sesi, rata-rata skor, materi terpopuler, pengguna aktif, grafik latihan per hari. |
| UC-27 | Melihat Laporan Transaksi | FR-22 | <img src="docs/ikon/tampilan.svg" width="16" height="16" alt="Tampilan selesai"> | `/admin/transaksi`: filter rentang tanggal dan status, tabel transaksi, total pendapatan. |

**Ringkasan:** 1 berfungsi penuh, 25 tampilan selesai, dan 1 belum dikerjakan (UC-19, murni proses server). Halaman Beranda, Harga, Tentang, Kebijakan Privasi, Syarat & Ketentuan, Dashboard Pengguna, dan halaman 404 juga sudah dibuat.

## Kebutuhan non-fungsional yang sudah diperhatikan

- **NFR-07 Privasi:** rekaman hanya berupa `Blob` di memori browser dan tidak dikirim ke mana pun.
- **NFR-09 Keandalan:** setiap kegagalan analisis menampilkan pesan yang jelas. Sesi yang gagal ditandai batal agar kuota tidak berkurang.
- **NFR-10 Kemudahan:** alur latihan dibagi menjadi tiga langkah bernomor, dengan kiat sebelum latihan di dashboard.
- **NFR-11 Bahasa:** seluruh antarmuka, pesan galat, dan panduan berbahasa Indonesia.
- **NFR-13 Responsif:** tata letak dirancang mobile-first untuk lebar 360–1920 px tanpa gulir horizontal.

## Rencana tahap berikutnya

1. Integrasi Supabase Auth dan basis data. Ganti isi fungsi `lib/api/` dan tambahkan middleware untuk grup `(pengguna)`.
2. API route untuk hak akses, kuota, dan sesi analisis (`getStatusEfektif`, perhitungan kuota WIB).
3. Pembacaan berkas MIDI dengan `@tonejs/midi` dari Supabase Storage.
4. Mesin analisis: CREPE (TensorFlow.js) di `lib/audio/crepe.ts`, DTW di `lib/audio/dtw.ts`, dan perhitungan skor.
5. Riwayat, grafik progres, langganan, Midtrans, dan halaman admin.
6. Dockerfile dan docker-compose (NFR-14).
