# Rencana Uji Nadalaya (Localhost)

Rencana pengujian menyeluruh untuk prototype Nadalaya, terdiri atas:

1. **Uji fungsional black-box** per use case. Kolom "Hasil aktual" dan "Status" diisi penguji/pengembang.
2. **Uji kebutuhan non-fungsional**, dilakukan secara otomatis.

Semua pengujian di dokumen ini dijalankan di **http://localhost:3000**, baik dengan `npm run dev` maupun `docker compose up --build`.

## Persiapan

| Kebutuhan | Keterangan |
|---|---|
| Lingkungan | http://localhost:3000 dengan `npm run dev` (pengembangan) atau `docker compose up --build` (produksi) |
| Database | Migrasi 01–04 sudah dijalankan di Supabase |
| Akun uji | Satu akun Gratis, satu akun Premium atau uji coba aktif, satu akun admin, dan satu akun yang akan dinonaktifkan |
| Perangkat | Laptop dengan mikrofon dan headphone di browser Chrome, Edge. |
| Pengisian status | **Lolos** atau **Gagal** dan tulis temuan di "Hasil aktual" |

## 1. Uji Fungsional (Black-Box)

### UC-01 Mendaftar Akun

| ID | UC | Skenario | Langkah | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| TC-01-01 | UC-01 | Data valid | Buka `/daftar`, isi nama, email baru, dan kata sandi ≥ 8 karakter, lalu tekan Daftar | Diarahkan ke halaman verifikasi email; email verifikasi diterima; akun baru berstatus Gratis | Sesuai | Lolos |
| TC-01-02 | UC-01 | Email sudah terdaftar dan terverifikasi | Daftar dengan email yang sudah dipakai akun lain yang sudah aktif | Pesan "Email sudah digunakan. Silakan masuk atau gunakan email lain." di kolom email; tidak diarahkan ke halaman cek email; tidak ada akun ganda | Sesuai | Lolos |
| TC-01-02b | UC-01 | Email sudah terdaftar tetapi belum diverifikasi | Daftar lagi dengan email yang pernah didaftarkan tetapi belum diverifikasi (tunggu ±1 menit sejak pendaftaran pertama) | Diarahkan ke halaman cek email; email verifikasi baru diterima | Sesuai | Lolos |
| TC-01-03 | UC-01 | Kata sandi kurang dari 8 karakter | Isi kata sandi 7 karakter | Pesan "Kata sandi minimal 8 karakter." di kolom kata sandi; data tidak dikirim | Sesuai | Lolos |
| TC-01-04 | UC-01 | Input tidak valid | Kosongkan nama, isi email `nama@`, lalu tekan Daftar | Pesan pada kolom terkait ("Nama wajib diisi.", "Format email tidak valid. …") | Sesuai | Lolos |
| TC-01-05 | UC-01 | Pendaftaran berulang | Kirim pendaftaran dengan email yang sama 4 kali dalam 1 jam | Percobaan ke-4 ditolak: "Terlalu banyak percobaan. Silakan coba lagi dalam … ." | Sesuai | Lolos |
| TC-01-06 | UC-01 | Membuka tautan verifikasi yang sah | Setelah TC-01-01, buka tautan verifikasi di email | Diarahkan ke halaman masuk (`/masuk?verifikasi=berhasil`) dengan pemberitahuan "Email berhasil diverifikasi" dan "Akun Anda sudah aktif. Silakan masuk."; tidak langsung ke dashboard | Sesuai | Lolos |
| TC-01-07 | UC-01 | Masuk setelah verifikasi | Pada halaman masuk dari TC-01-06, isi email dan kata sandi yang didaftarkan, lalu tekan Masuk | Dashboard terbuka; akun berstatus Gratis | Sesuai | Lolos |
| TC-01-08 | UC-01 | Tidak ada sesi otomatis dari tautan verifikasi | Setelah TC-01-06 dan sebelum masuk, buka `http://localhost:3000/dashboard` | Dialihkan ke halaman masuk (belum masuk otomatis) | Sesuai | Lolos |
| TC-01-09 | UC-01 | Tautan verifikasi dipakai ulang atau kedaluwarsa | Buka lagi tautan verifikasi dari TC-01-06 | Diarahkan ke `/auth/verifikasi-gagal` dengan judul "Tautan verifikasi tidak berlaku", penjelasan bahwa tautan sudah kedaluwarsa atau sudah pernah dipakai, formulir kirim ulang, dan tautan Masuk | Sesuai | Lolos |
| TC-01-10 | UC-01 | Tautan verifikasi tidak lengkap | Buka tautan verifikasi yang dipotong sebagian (mis. hapus beberapa karakter terakhir `token_hash`), lalu buka `/auth/konfirmasi` tanpa parameter | Keduanya diarahkan ke halaman "Tautan verifikasi tidak berlaku" dengan penjelasan yang sesuai; tidak ada galat 500 | Sesuai | Lolos |
| TC-01-11 | UC-01 | Kirim ulang dari halaman galat | Di halaman galat, isi email akun yang belum diverifikasi, lalu tekan "Kirim Ulang Email Verifikasi" | Pesan bahwa tautan baru telah dikirim bila email terdaftar dan belum diverifikasi; tombol terkunci 60 detik; email baru diterima dan tautannya berlaku | Sesuai | Lolos |
| TC-01-12 | UC-01 | Input tidak valid di halaman galat | Kosongkan kolom email atau isi `nama@`, lalu tekan kirim ulang | Pesan "Email wajib diisi." / "Format email tidak valid. …"; tidak ada permintaan ke server | Sesuai | Lolos |
| TC-01-13 | UC-01 | Tautan dibuka di browser lain | Daftar di browser A, lalu buka tautan verifikasi di browser B | Browser B menampilkan halaman masuk dengan pemberitahuan "Email berhasil diverifikasi"; masuk dengan email dan kata sandi berhasil | Sesuai | Lolos |

### UC-02 Masuk ke Sistem

| ID | UC | Skenario | Langkah | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| TC-02-01 | UC-02 | Data valid | Masuk dengan akun Gratis | Diarahkan ke `/dashboard` | Sesuai| Lolos|
| TC-02-02 | UC-02 | Akun admin | Masuk dengan akun admin | Diarahkan ke `/admin` | Sesuai | Lolos |
| TC-02-03 | UC-02 | Kata sandi salah atau email tidak terdaftar | Masuk dengan kata sandi salah, lalu dengan email yang tidak terdaftar | Keduanya menampilkan pesan yang sama: "Email atau kata sandi salah." | Sesuai | Lolos |
| TC-02-04 | UC-02 | Email belum diverifikasi | Masuk dengan akun yang belum memverifikasi email | Pesan email belum diverifikasi dan pilihan kirim ulang verifikasi | Sesuai | Lolos |
| TC-02-05 | UC-02 | Akun nonaktif | Masuk dengan akun yang dinonaktifkan admin | Pesan "Akun Anda telah dinonaktifkan."; tidak masuk | Sesuai | Lolos |
| TC-02-06 | UC-02 | Percobaan berulang | Masuk dengan kata sandi salah 6 kali dalam 15 menit untuk email yang sama | Percobaan ke-6 ditolak dengan pesan "Terlalu banyak percobaan…" beserta waktu tunggu | Sesaui | Lolos |
| TC-02-07 | UC-02 | Halaman terlindungi tanpa masuk | Buka `/riwayat` tanpa masuk, lalu masuk | Diarahkan ke `/masuk`; setelah masuk kembali ke `/riwayat` | Sesuai | Lolos |
| TC-02-08 | UC-02 | Pengalihan ke situs luar | Buka `/masuk?lanjut=/%5Cevil.com`, lalu masuk | Diarahkan ke `/dashboard`, bukan ke situs luar | Sesuai | Lolos |

### UC-03 Mengatur Ulang Kata Sandi

| ID | UC | Skenario | Langkah | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| TC-03-01 | UC-03 | Email terdaftar | Buka `/lupa-kata-sandi`, isi email terdaftar, buka tautan di email, lalu isi kata sandi baru | Kata sandi berubah; diminta masuk ulang dengan kata sandi baru | Sesuai | Lolos |
| TC-03-02 | UC-03 | Email tidak terdaftar | Isi email yang tidak terdaftar | Pesan umum yang sama seperti TC-03-01 (tidak membocorkan keberadaan akun) | Sesuai | Lolos |
| TC-03-03 | UC-03 | Tautan kedaluwarsa atau sudah dipakai | Buka tautan yang sama untuk kedua kalinya | Pesan tautan tidak berlaku dan ajakan meminta tautan baru | Sesuai | Lolos |
| TC-03-04 | UC-03 | Tanpa tautan pemulihan | Dalam keadaan masuk biasa, buka `/atur-ulang-kata-sandi` dan kirim kata sandi baru | Ditolak: "Tautan atur ulang kata sandi sudah tidak berlaku." | Sesuai | Lolos |
| TC-03-05 | UC-03 | Kata sandi baru tidak valid | Isi kata sandi baru 5 karakter | Pesan "Kata sandi minimal 8 karakter." | Sesuai | Lolos |
| TC-03-06 | UC-03 | Alur pemulihan tidak ikut berubah | Buka tautan atur ulang kata sandi yang sah, lalu tautan yang sama untuk kedua kalinya | Tautan sah membuka `/atur-ulang-kata-sandi` (bukan halaman masuk); tautan kedua menampilkan pesan tautan tidak berlaku di halaman atur ulang | Sesuai | Lolos |

### UC-04 Keluar dari Sistem

| ID | UC | Skenario | Langkah | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| TC-04-01 | UC-04 | Keluar | Pilih Keluar pada menu akun, lalu konfirmasi | Sesi berakhir dan diarahkan ke halaman publik | Sesuai | Lolos |
| TC-04-02 | UC-04 | Kembali setelah keluar | Setelah keluar, tekan tombol Back browser ke `/dashboard` | Diarahkan ke `/masuk` | Sesuai | Lolos |

### UC-05 Mengubah Profil

| ID | UC | Skenario | Langkah | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| TC-05-01 | UC-05 | Nama valid | Buka `/profil`, ubah nama, lalu simpan | Nama baru tersimpan dan tampil di menu akun | Sesuai | Lolos |
| TC-05-02 | UC-05 | Input tidak valid | Isi nama 1 karakter atau kosong | Pesan "Nama minimal 2 karakter." atau "Nama wajib diisi."; tidak tersimpan | Sesuai | Lolos |

### UC-06 Melihat Daftar Materi

| ID | UC | Skenario | Langkah | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| TC-06-01 | UC-06 | Pengguna Gratis | Buka `/materi` | Materi dikelompokkan per jenis dan tingkat; materi Premium bertanda terkunci |  Sesuai | Lolos |
| TC-06-02 | UC-06 | Pengguna Premium | Buka `/materi` dengan akun Premium | Semua materi terbuka | Sesuai | Lolos|
| TC-06-03 | UC-06 | Gagal memuat | Matikan koneksi, lalu muat ulang `/materi` | Pesan gagal memuat dan tombol Muat Ulang | Sesuai | Lolos |

### UC-07 Menyaring Materi

| ID | UC | Skenario | Langkah | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| TC-07-01 | UC-07 | Saring jenis dan tingkat | Pilih jenis "Interval" dan tingkat "Dasar" | Hanya materi yang sesuai yang tampil | Sesuai | Lolos |
| TC-07-02 | UC-07 | Tidak ada hasil | Pilih kombinasi yang tidak memiliki materi | Pesan "Materi tidak ditemukan" | Sesuai | Lolos |

### UC-08 Memilih Materi Latihan

| ID | UC | Skenario | Langkah | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| TC-08-01 | UC-08 | Materi gratis | Pengguna Gratis memilih materi tangga nada | Halaman latihan terbuka dengan notasi | Sesuai | Lolos |
| TC-08-02 | UC-08 | Materi Premium oleh pengguna Gratis | Pengguna Gratis membuka materi interval atau melodi (lewat daftar maupun URL langsung) | Halaman "Materi ini khusus Premium" dengan ajakan beralih ke Premium atau mengaktifkan uji coba; acuan MIDI tidak dimuat | Sesuai | Lolos |
| TC-08-03 | UC-08 | Kuota Gratis habis | Setelah 3 analisis selesai hari ini, buka halaman latihan mana pun | Halaman latihan terblokir: "Kuota analisis hari ini sudah habis" dan waktu kuota diperbarui (00.00 WIB) | Sesuai | Lolos |

### UC-09 Memeriksa Hak Akses dan Kuota

| ID | UC | Skenario | Langkah | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| TC-09-01 | UC-09 | Sisa kuota tampil | Akun Gratis dengan 1 analisis selesai membuka dashboard | Sisa kuota 2 | Sesuai | Lolos |
| TC-09-02 | UC-09 | Cek ulang kuota saat Analisis | Dengan sisa kuota 1, buka halaman latihan di dua tab. Selesaikan analisis di tab A, lalu rekam dan tekan Analisis di tab B. | Tab B menampilkan "Kuota analisis hari ini sudah habis"; rekaman tidak dianalisis dan kuota tidak berkurang | Sesuai | Lolos |
| TC-09-03 | UC-09 | Analisis lain sedang berjalan | Dengan sisa kuota 1, tekan Analisis di dua tab hampir bersamaan | Hanya satu yang berjalan; tab lain menampilkan pesan analisis lain sedang berjalan | Sesuai | Lolos |
| TC-09-04 | UC-09 | Pengguna Premium | Lakukan lebih dari 3 analisis dengan akun Premium | Tidak ada batas kuota | Sesuai | Lolos |
| TC-09-05 | UC-09 | Akun dinonaktifkan saat sedang masuk | Admin menonaktifkan akun yang sedang membuka halaman latihan, lalu pengguna menekan Analisis | Ditolak dengan pesan akun dinonaktifkan dan diarahkan ke halaman masuk | Sesuai | Lolos  |

### UC-10 Memutar Acuan MIDI dan Notasi

| ID | UC | Skenario | Langkah | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| TC-10-01 | UC-10 | Putar acuan | Tekan "Putar Acuan" | Acuan terdengar; not yang sedang diputar disorot di notasi | Sesuai | Lolos |
| TC-10-01b | UC-10 | Sorotan notasi sinkron dengan nada pada putaran pertama | Tutup semua tab Nadalaya, buka halaman latihan di tab baru, lalu langsung tekan "Putar Acuan" (putaran pertama setelah halaman dibuka). Ulangi dengan menekan "Putar Acuan" sekali lagi. | Pada kedua putaran, not yang disorot di notasi berpindah bersamaan dengan nada yang terdengar; sorotan tidak mendahului suara | Sesuai | Lolos |
| TC-10-02 | UC-10 | Notasi tampil benar | Buka setiap materi (tangga nada, interval, melodi) | Kunci G, birama, kepala not, tangkai, dan garis bantu tampil (bukan kotak kosong) | Sesuai | Lolos |

### UC-11 Merekam Suara

| ID | UC | Skenario | Langkah | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| TC-11-01 | UC-11 | Rekam normal | Tekan tombol rekam, bernyanyi 10 detik, lalu berhenti | Durasi tampil; rekaman bisa didengar ulang dan direkam ulang | Sesuai | Lolos |
| TC-11-02 | UC-11 | Izin mikrofon ditolak | Tolak izin mikrofon saat diminta | Pesan "Izin mikrofon ditolak" dan petunjuk mengizinkan mikrofon | Sesuai | Lolos |
| TC-11-03 | UC-11 | Lebih dari 60 detik | Rekam tanpa berhenti | Perekaman berhenti otomatis pada 1:00 | Sesuai | Lolos |
| TC-11-04 | UC-11 | Kurang dari 2 detik atau tanpa suara | Rekam 1 detik, lalu rekam 5 detik tanpa bersuara | Pesan untuk merekam ulang; tombol Analisis tidak dapat dipakai; kuota tidak berkurang | Sesuai | Lolos |

### UC-12 Menganalisis Akurasi Nada

| ID | UC | Skenario | Langkah | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| TC-12-01 | UC-12 | Analisis berhasil | Nyanyikan materi dengan benar, lalu tekan Analisis | Tahapan analisis tampil; hasil skor muncul; kuota Gratis berkurang 1 | Sesuai | Lolos |
| TC-12-02 | UC-12 | Nada tidak terdeteksi | Rekam suara bising atau bisikan tanpa nada, lalu tekan Analisis | Pesan "Suara tidak terdeteksi, silakan rekam ulang"; kuota tidak berkurang | Sesuai | Lolos |
| TC-12-03 | UC-12 | Nyanyian beda oktaf atau tempo | Nyanyikan materi satu oktaf lebih rendah, lalu dengan tempo sedikit lebih cepat | Skor tetap tinggi (oktaf dan tempo tidak dihukum) | Sesuai | Lolos |

### UC-13 Menampilkan Skor dan Grafik Nada

| ID | UC | Skenario | Langkah | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| TC-13-01 | UC-13 | Skor dan grafik | Setelah analisis berhasil | Skor 0–100, label kategori, grafik nada nyanyian terhadap acuan, dan daftar nada meleset | Sesuai | Lolos |
| TC-13-02 | UC-13 | Riwayat gagal disimpan | Matikan koneksi setelah analisis selesai dan sebelum hasil tersimpan | Skor tetap tampil dengan pesan bahwa riwayat gagal disimpan; kuota tidak berkurang | Sesuai | Lolos |

### UC-14 Melihat Riwayat Latihan

| ID | UC | Skenario | Langkah | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| TC-14-01 | UC-14 | Pengguna Premium | Buka `/riwayat`, lalu satu detail riwayat | Daftar latihan dan detail skor serta grafik | Sesuai | Lolos |
| TC-14-02 | UC-14 | Pengguna Gratis | Buka `/riwayat` dengan akun Gratis | Ajakan beralih ke Premium | Sesuai | Lolos |
| TC-14-03 | UC-14 | Belum ada riwayat | Akun Premium baru membuka `/riwayat` | Pesan "Belum ada latihan" dan tombol menuju daftar materi | Sesuai | Lolos |

### UC-15 Melihat Grafik Progres

| ID | UC | Skenario | Langkah | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| TC-15-01 | UC-15 | Pengguna Premium | Buka `/progres` setelah beberapa latihan | Grafik progres skor per jenis materi | Sesuai | Lolos |
| TC-15-02 | UC-15 | Pengguna Gratis | Buka `/progres` dengan akun Gratis | "Grafik progres khusus Premium" dan ajakan beralih ke Premium | Sesuai | Lolos |
| TC-15-03 | UC-15 | Data belum cukup | Akun Premium dengan 0–1 latihan membuka `/progres` | "Data belum cukup untuk menampilkan grafik" | Sesuai | Lolos |

### UC-16 Mengaktifkan Uji Coba Premium

| ID | UC | Skenario | Langkah | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| TC-16-01 | UC-16 | Aktivasi pertama | Akun Gratis menekan tombol uji coba di `/langganan` | Status menjadi Uji Coba Premium; "Sisa 7 hari"; materi Premium terbuka | Sesuai | Lolos |
| TC-16-02 | UC-16 | Sudah pernah dipakai | Akun yang pernah memakai uji coba membuka `/langganan` | Tombol uji coba tidak tampil; tersedia pilihan paket berbayar | Sesuai | Lolos |
| TC-16-03 | UC-16 | Klik ganda | Tekan tombol uji coba dua kali dengan cepat | Uji coba hanya aktif sekali | Sesuai | Lolos |
| TC-16-04 | UC-16 | Uji coba berakhir | Setelah masa uji coba lewat (atau ubah `tanggal_berakhir` di database uji) | Status kembali Gratis; dashboard menampilkan pemberitahuan uji coba berakhir | Sesuai | Lolos |

### UC-17 s.d. UC-19 Pembayaran (Midtrans)

| ID | UC | Skenario | Langkah | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| TC-17-01 | UC-17 | Membeli paket langganan | – | – | Integrasi Midtrans belum dibuat | Ditunda |
| TC-18-01 | UC-18 | Memproses pembayaran (termasuk signature key tidak valid dan pembayaran kedaluwarsa) | – | – | Integrasi Midtrans belum dibuat | Ditunda |
| TC-19-01 | UC-19 | Mengaktifkan langganan setelah pembayaran berhasil | – | – | Integrasi Midtrans belum dibuat | Ditunda |

### UC-20 s.d. UC-23 Pengelolaan Materi (Admin)

| ID | UC | Skenario | Langkah | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| TC-20-01 | UC-20 | Melihat data materi | Admin membuka `/admin/materi`, mencari judul, dan menyaring jenis | Daftar materi sesuai pencarian dan saringan | Sesuai | Lolos |
| TC-20-02 | UC-20 | Pengguna biasa membuka halaman admin | Akun Gratis membuka `/admin` dan `/admin/materi` | Diarahkan ke `/dashboard` | Sesuai | Lolos |
| TC-20-03 | UC-20 | Pengguna biasa memanggil API admin | Akun Gratis memanggil `GET /api/admin/materi` dari DevTools | Ditolak (403): "Halaman ini khusus admin." | Sesuai | Lolos |
| TC-21-01 | UC-21 | Menambah materi valid | Isi judul, jenis, tingkat, tempo, dan unggah berkas `.mid` melodi tunggal | Materi baru tampil di daftar admin dan daftar materi pengguna | Sesuai | Lolos |
| TC-21-02 | UC-21 | Berkas bukan MIDI | Unggah berkas `.txt` yang diganti namanya menjadi `.mid` | Pesan "Berkas tidak dapat dibaca sebagai MIDI." | Sesuai | Lolos |
| TC-21-03 | UC-21 | Berkas lebih dari 1 MB | Unggah berkas MIDI berukuran lebih dari 1 MB | Pesan "Ukuran berkas MIDI maksimal 1 MB." | Sesuai | Lolos |
| TC-21-04 | UC-21 | MIDI berisi akor | Unggah MIDI dengan nada yang berbunyi bersamaan | Pesan bahwa berkas harus berisi melodi tunggal | Sesuai | Lolos |
| TC-21-05 | UC-21 | Input tidak valid | Kosongkan judul atau isi tempo 300 | Pesan "Judul wajib diisi." / "Tempo harus bilangan bulat 40–240 BPM." | Sesuai|Lolos |
| TC-22-01 | UC-22 | Mengubah materi | Ubah judul dan ganti berkas MIDI | Perubahan tersimpan; acuan baru dipakai di halaman latihan | Sesuai | Lolos |
| TC-23-01 | UC-23 | Menghapus materi yang belum dipakai | Hapus materi tanpa sesi atau riwayat | Materi terhapus | Sesuai | Lolos |
| TC-23-02 | UC-23 | Menghapus materi yang sudah dipakai | Hapus materi yang memiliki riwayat latihan | Materi dinonaktifkan (tidak dihapus); riwayat lama tetap ada | Sesuai | Lolos |

### UC-24 dan UC-25 Pengelolaan Pengguna (Admin)

| ID | UC | Skenario | Langkah | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| TC-24-01 | UC-24 | Melihat data pengguna | Buka `/admin/pengguna`, cari nama atau email, saring paket, lalu buka detail | Daftar dan detail sesuai, termasuk latihan terakhir | Sesuai | Lolos |
| TC-25-01 | UC-25 | Menonaktifkan akun | Nonaktifkan akun pengguna yang sedang masuk di browser lain | Akun nonaktif; pengguna langsung keluar pada aksi berikutnya dan tidak dapat masuk lagi | Sesuai | Lolos |
| TC-25-02 | UC-25 | Menonaktifkan diri sendiri atau admin lain | Admin mencoba menonaktifkan akunnya sendiri atau akun admin lain | Ditolak: "Anda tidak dapat menonaktifkan akun Anda sendiri." / "Akun admin tidak dapat dinonaktifkan." | Sesuai | Lolos |
| TC-25-03 | UC-25 | Mengaktifkan kembali | Aktifkan kembali akun yang dinonaktifkan | Pengguna dapat masuk lagi | Sesuai | Lolos |

### UC-26 dan UC-27 Laporan (Admin)

| ID | UC | Skenario | Langkah | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| TC-26-01 | UC-26 | Statistik latihan | Buka `/admin/statistik` dengan rentang 30 hari | Jumlah sesi, rata-rata skor, materi terpopuler, pengguna aktif, dan grafik per hari | Sesuai | Lolos |
| TC-26-02 | UC-26 | Rentang tanggal tidak valid | Isi tanggal akhir sebelum tanggal awal | Pesan "Tanggal akhir tidak boleh sebelum tanggal awal." | Sesuai | Lolos |
| TC-27-01 | UC-27 | Laporan transaksi | Buka `/admin/transaksi` | "Belum ada transaksi" (data pembayaran belum tersedia karena Midtrans ditunda) | Sesuai | Lolos |

## 2. Uji Kebutuhan Non-Fungsional

**Tanggal uji:** 1–2 November 2026 (uji ulang setelah TM-02 dan TM-03 diperbaiki: 2 November 2026).

**Lingkungan uji otomatis dan browser:**

| Komponen | Keterangan |
|---|---|
| Server | Image Docker produksi (`docker compose build`) di http://localhost:3200 |
| Browser | Microsoft Edge 156, Google Chrome 156, dan Firefox 157 (build Playwright), semuanya headless dan dijalankan dengan Playwright |
| Perangkat | GPU terintegrasi AMD Radeon (WebGL lewat Direct3D 11), 12 thread CPU |
| Akun | Akun uji sementara: Premium dan admin, dibuat baru untuk setiap browser dan dihapus setelah uji |
| Mikrofon | Berkas tangga nada Do mayor sintetis selama ±30 detik. Chrome dan Edge memakai mikrofon palsu bawaan Chromium; Firefox tidak memilikinya, jadi `getUserMedia` diganti aliran audio dari berkas yang sama (dialog izin mikrofon Firefox tidak ikut teruji) |

### Ringkasan

| NFR | Parameter | Metode | Alat / berkas | Hasil terakhir | Status |
|---|---|---|---|---|---|
| NFR-01 | Waktu analisis rekaman 30 detik ≤ 15 detik | Uji browser + log waktu (mode pengembangan) | Edge, Chrome, Firefox headless; log `[analisis]`; [tests/dtw-skor.test.ts](../../tests/dtw-skor.test.ts) | Setelah TM-02 diperbaiki: analisis pertama 8,9–12,0 dtk, analisis berikutnya 8,9–10,3 dtk di ketiga browser (sebelumnya analisis pertama 18,1–18,9 dtk) | Lolos |
| NFR-02 | Halaman utama ≤ 3 detik pada 10 Mbps | Otomatis + uji browser | [tests/e2e/waktu-muat.spec.ts](../../tests/e2e/waktu-muat.spec.ts); Edge dengan pembatasan 10 Mbps | Beranda 345–390 ms, daftar materi 519 ms, dashboard 824 ms (produksi, cache dimatikan) | Lolos |
| NFR-03 | Tepat ≥ 80, meleset 1 semiton ≤ 50 | Otomatis | [tests/nfr.test.ts](../../tests/nfr.test.ts) (kelima materi), [tests/analisis.test.ts](../../tests/analisis.test.ts) (CREPE) | Kelima materi: tepat ≥ 80, ±1 semiton ≤ 50; CREPE dengan audio sintetis: tepat 100, +1 semiton 22 | Lolos |
| NFR-04 | Kata sandi ter-hash | Pemeriksaan data | Kolom `public.users`, objek pengguna Supabase Auth | Tidak ada kolom maupun nilai kata sandi di data aplikasi | Lolos |
| NFR-05 | RLS dan akses admin | Uji izin database + manual | Akun pengguna sungguhan; [supabase/audit-keamanan.sql](../../supabase/audit-keamanan.sql); TC-20-02, TC-20-03 | Pengguna hanya membaca datanya sendiri; ubah peran dan fungsi server ditolak; halaman dan API admin ditolak | Lolos |
| NFR-06 | Webhook Midtrans | – | – | Integrasi Midtrans belum dibuat | Ditunda |
| NFR-07 | Rekaman tidak diunggah | Otomatis + uji browser | [tests/nfr.test.ts](../../tests/nfr.test.ts); rekaman lalu lintas jaringan di Edge | 3 kali rekam dan analisis: hanya 6 permintaan JSON (51 B dan ±7,7 KB), tanpa audio | Lolos |
| NFR-08 | Uptime ≥ 95% per bulan | – | Perlu hosting publik | – | Ditunda sampai deploy |
| NFR-09 | Kegagalan analisis jelas dan tidak mengurangi kuota | Otomatis + manual | [tests/nfr.test.ts](../../tests/nfr.test.ts); TC-11-04, TC-12-02 | Rekaman hening atau terlalu pendek memberi pesan jelas; TC-11-04 dan TC-12-02 lolos | Lolos |
| NFR-11 | Bahasa Indonesia | Otomatis + uji browser + manual | [tests/e2e/bahasa.spec.ts](../../tests/e2e/bahasa.spec.ts), [tests/nfr.test.ts](../../tests/nfr.test.ts); Edge; templat email Supabase | 8 halaman publik, 7 halaman pengguna, 5 halaman admin: `lang="id"`, tanpa istilah Inggris; templat email berbahasa Indonesia | Lolos |
| NFR-12 | Chrome, Edge, Firefox, Chrome Android | Uji browser (Playwright) | Checklist di bawah | Chrome 156, Edge 156, Firefox 157: semua fungsi lolos, 0 pelanggaran CSP, 0 galat console (setelah TM-03 diperbaiki) | Desktop: Lolos; Chrome Android: Ditunda sampai deploy |
| NFR-13 | Tanpa scroll horizontal 360–1920 px | Otomatis | [tests/e2e/responsif.spec.ts](../../tests/e2e/responsif.spec.ts), tangkapan di [tests/e2e/tangkapan/](../../tests/e2e/tangkapan/) | 8 halaman publik × 4 lebar lolos (produksi), setelah TM-01 diperbaiki | Lolos |
| NFR-14 | Dibangun dan dijalankan dengan satu perintah | Uji Docker | `docker compose build`, lalu container dijalankan | Image terbangun (±6 menit); beranda, model CREPE, dan font notasi dapat diakses dari container | Lolos |
| NFR-15 | 20 pengguna aktif bersamaan | Manual | Checklist di bawah | – | Ditunda sampai deploy |

### Cara menjalankan uji otomatis

| Perintah | Isi |
|---|---|
| `npm test` | Vitest: analisis nada (termasuk CREPE), DTW, validasi, keamanan, dan NFR-03/07/09/11 |
| `npm run test:e2e` | Playwright: NFR-13 (responsif), NFR-02 (waktu muat beranda), NFR-11 (bahasa). Secara bawaan menyalakan `npm run dev` dan memakai Microsoft Edge yang terpasang. |
| `E2E_BASE_URL=http://localhost:3000 npm run test:e2e` | Menguji server yang sudah berjalan, misalnya container Docker. Batas 3 detik NFR-02 hanya ditegakkan dalam mode ini. |
| `PW_CHANNEL= npm run test:e2e` | Memakai Chromium bawaan Playwright (pasang dulu dengan `npx playwright install chromium`) |

Tangkapan layar NFR-13 tersimpan di `tests/e2e/tangkapan/` dengan nama `<halaman>-<lebar>.png` (8 halaman × 4 lebar, ±7 MB). Folder ini tidak dilacak Git; jalankan `npm run test:e2e` untuk membuatnya ulang.

### NFR-01 Waktu Analisis

**Cara mengukur:**

- **Produksi:** diukur dari klik "Analisis" sampai skor tampil, dengan rekaman 30 detik. Analisis pertama dilakukan dengan profil browser baru (model belum tersimpan), dan analisis berikutnya di halaman yang sama lewat "Latih Lagi".
- Sejak TM-02 diperbaiki, model dimuat dan dipanaskan selama pengguna merekam. Analisis pertama tetap diukur dari klik "Analisis", jadi waktu itu sudah termasuk sisa pemuatan model yang belum selesai.
- **Mode pengembangan:** rincian waktu diambil dari log `[analisis] rekaman … · model … · CREPE … · DTW+skor … · total …`, yang hanya muncul di mode pengembangan.

| Percobaan | Perangkat / browser | Durasi rekaman | Model | CREPE | DTW + skor | Total | Status |
|---|---|---|---|---|---|---|---|
| 1 (cache kosong, produksi) | Edge 156, AMD Radeon | 30 dtk | – | – | – | 18,9 dtk | Gagal |
| 2 (produksi) | Edge 156, AMD Radeon | 30 dtk | – | – | – | 9,6 dtk | Lolos |
| 3 (produksi) | Edge 156, AMD Radeon | 30 dtk | – | – | – | 8,6 dtk | Lolos |
| Ulangan 1 (cache kosong, produksi) | Edge 156, AMD Radeon | 30 dtk | – | – | – | 18,1 dtk | Gagal |
| Rincian 1 (cache kosong, pengembangan) | Edge 156, AMD Radeon | 30,4 dtk | 2,7 dtk | 14,5 dtk | 0,03 dtk | 17,2 dtk (log); 19,4 dtk sampai skor tampil | Gagal |
| **Setelah TM-02 diperbaiki** | | | | | | | |
| 1 (cache kosong, produksi) | Edge 156, AMD Radeon | 30 dtk | – | – | – | 12,0 dtk | Lolos |
| 1 (cache kosong, produksi, image akhir) | Edge 156, AMD Radeon | 30 dtk | – | – | – | 10,0 dtk | Lolos |
| 2 (produksi, image akhir) | Edge 156, AMD Radeon | 30 dtk | – | – | – | 9,3 dtk | Lolos |
| 1 (cache kosong, produksi) | Chrome 156, AMD Radeon | 30 dtk | – | – | – | 8,9 dtk; ulangan 9,4 dtk | Lolos |
| 2 (produksi) | Chrome 156, AMD Radeon | 30 dtk | – | – | – | 10,1 dtk; ulangan 9,8 dtk | Lolos |
| 1 (cache kosong, produksi) | Firefox 157, AMD Radeon | 30 dtk | – | – | – | 10,9 dtk; ulangan 9,7 dan 10,1 dtk | Lolos |
| 2 (produksi) | Firefox 157, AMD Radeon | 30 dtk | – | – | – | 9,6 dtk; ulangan 10,3 dtk | Lolos |

**Kesimpulan:** sebelum perbaikan, analisis pertama melebihi batas karena model dimuat (±2,7 dtk) dan TensorFlow.js/WebGL "dipanaskan" saat analisis pertama (±6 dtk tambahan pada CREPE). Setelah TM-02 diperbaiki, analisis pertama setara dengan analisis berikutnya, yaitu 8,9–12,0 dtk di ketiga browser, dan memenuhi batas 15 detik.

### NFR-02 Waktu Muat

Diukur di Edge dengan pembatasan jaringan 10 Mbps (latensi 40 ms) dan cache dimatikan, terhadap server produksi. Untuk memeriksa ulang secara manual: di DevTools, buka tab Network, pilih *throttling* khusus 10 Mbps, centang *Disable cache*, muat ulang halaman, lalu catat nilai **Load** di bilah status.

| Halaman | Waktu muat | Status |
|---|---|---|
| Beranda (`/`) | 390 ms (Playwright: 345 ms) | Lolos |
| Daftar materi (`/materi`) | 519 ms | Lolos |
| Dashboard (`/dashboard`) | 824 ms | Lolos |

### NFR-04, NFR-05, NFR-07 Keamanan dan Privasi

| Pemeriksaan | Langkah | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|
| Kata sandi ter-hash | Periksa kolom `public.users` dan objek pengguna dari Supabase Auth | Tidak ada kolom atau nilai kata sandi teks biasa | `public.users` hanya berisi id, nama, email, peran, status paket, tanggal, dan status akun; objek pengguna Auth tidak memuat kata sandi. Penyimpanan hash dikelola Supabase Auth. | Lolos |
| RLS: data sendiri | Masuk sebagai pengguna biasa, lalu baca tabel `users`, `riwayat_latihan`, dan `transaksi` langsung ke database | Hanya data milik sendiri yang terbaca | `users`: 1 baris (miliknya); riwayat dan transaksi orang lain: 0 baris | Lolos |
| RLS: hak ubah | Sebagai pengguna biasa, ubah kolom `peran` menjadi `admin`, lalu panggil fungsi server `aktifkan_uji_coba` | Keduanya ditolak | Keduanya ditolak (kode `42501`, izin ditolak) | Lolos |
| Akses admin | TC-20-02 dan TC-20-03 | Halaman dan API admin ditolak untuk pengguna biasa | Sesuai | Lolos |
| Audit database | Jalankan `supabase/audit-keamanan.sql` bagian 1–11 | Sesuai "Harapan" di setiap bagian | Dijalankan pengembang; hak tambahan yang ditemukan sudah dicabut lewat migrasi 02/03 | Lolos |
| Rekaman tidak diunggah | Rekam lalu analisis sambil merekam lalu lintas jaringan | Tidak ada permintaan berisi audio | 3 kali rekam dan analisis: hanya `POST /api/sesi` (51 B) dan `POST /api/sesi/…/hasil` (±7,7 KB), keduanya JSON | Lolos |

### NFR-11 Bahasa

| Pemeriksaan | Hasil aktual | Status |
|---|---|---|
| Halaman publik, pengguna, dan admin tidak memuat teks berbahasa Inggris | 20 halaman diperiksa otomatis (8 publik, 7 pengguna, 5 admin): semua `lang="id"`, tanpa istilah seperti Loading, Submit, Login, Password, Cancel, Delete, Save, atau Search | Lolos |
| Pesan galat berbahasa Indonesia (jaringan putus, mikrofon ditolak, kuota habis, sesi) | Pesan galat server diperiksa otomatis; TC-06-03, TC-08-03, dan TC-11-02 lolos | Lolos |
| Email verifikasi dan atur ulang kata sandi berbahasa Indonesia (templat email di Supabase) | Templat di dashboard Supabase diperiksa pengembang: berbahasa Indonesia | Lolos |

### NFR-12 Kompatibilitas Browser

Ketiga kolom desktop diisi dari uji browser otomatis dengan Playwright terhadap image produksi. Alurnya sama di setiap browser: masuk lewat form, buka latihan Tangga Nada Do Mayor, putar acuan, rekam 30 detik, dengarkan ulang, analisis dua kali, buka riwayat dan progres, keluar lewat menu akun, lalu masuk sebagai admin dan membuka 5 halaman admin.

Kolom Chrome (Android) **Ditunda sampai deploy**: localhost hanya dapat dibuka dari laptop yang menjalankannya, dan browser ponsel hanya mengizinkan mikrofon lewat HTTPS.

| Fungsi | Chrome (desktop) | Edge (desktop) | Firefox (desktop) | Chrome (Android) |
|---|---|---|---|---|
| Daftar, masuk, keluar | Lolos: masuk lewat form, keluar lewat menu akun, lalu `/dashboard` dialihkan ke `/masuk`; daftar: lihat TC-01 | Lolos (sama dengan Chrome) | Lolos (sama dengan Chrome) | Ditunda sampai deploy |
| Notasi tampil benar (kunci G, kepala not) | Lolos (kunci G 1, kepala not 15) | Lolos (kunci G 1, kepala not 15) | Lolos (kunci G 1, kepala not 15) | Ditunda sampai deploy |
| Putar acuan MIDI | Lolos (not tersorot berurutan) | Lolos (not tersorot berurutan) | Lolos (not tersorot berurutan) | Ditunda sampai deploy |
| Izin dan perekaman mikrofon | Lolos (mikrofon palsu, rekaman 30 dtk) | Lolos (mikrofon palsu, rekaman 30 dtk) | Lolos untuk perekaman (aliran audio pengganti, rekaman 30 dtk); dialog izin tidak teruji | Ditunda sampai deploy |
| Dengarkan ulang rekaman | Lolos (pemutar berjalan, posisi maju 1,5 dtk) | Lolos (pemutar berjalan, posisi maju 1,5 dtk) | Lolos (pemutar berjalan, posisi maju 1,4 dtk) | Ditunda sampai deploy |
| Analisis (model CREPE termuat) | Lolos (WebGL Direct3D 11; skor 100) | Lolos (WebGL Direct3D 11; skor 100) | Lolos (WebGL Direct3D 11; skor 100) | Ditunda sampai deploy |
| Grafik skor, riwayat, dan progres | Lolos | Lolos | Lolos | Ditunda sampai deploy |
| Halaman admin | Lolos (5 halaman) | Lolos (5 halaman) | Lolos (5 halaman) | Ditunda sampai deploy |
| Tidak ada pelanggaran CSP di Console | Lolos (0 pelanggaran, 0 galat console) | Lolos (0 pelanggaran, 0 galat console) | Lolos (0 pelanggaran, 0 galat console) | Ditunda sampai deploy |
| Versi browser | Chrome 156.0.8078.74 | Edge 156.0.4314.58 | Firefox 157.0 (build Playwright) | – |

Firefox yang dipakai adalah build Firefox dari Playwright, bukan Firefox rilis yang dipasang dari Mozilla. Bila ingin memastikan di Firefox biasa, ulangi baris "Izin dan perekaman mikrofon" secara manual untuk menguji dialog izinnya.

### NFR-14 Pemeliharaan

| Pemeriksaan | Hasil aktual | Status |
|---|---|---|
| Image dibangun dan dijalankan dengan satu perintah (`docker compose up --build`) | `docker compose build` berhasil dalam ±6 menit; container berjalan sebagai user non-root | Lolos |
| Beranda, `/models/crepe/model.json`, dan `/fonts/vexflow/bravura.woff2` dapat diakses dari container | 200 untuk ketiganya | Lolos |
| `docker compose down` menghentikan container | Pernah diuji saat Docker disiapkan | Lolos |
| Dibangun dari folder bersih (setelah `git clone` dan mengisi `.env.local`) | Repo di-`git clone` ke folder baru, lalu dibangun dengan `docker build` dan nilai `NEXT_PUBLIC_*` sebagai argumen build: berhasil dalam 6,1 menit. Container berjalan sebagai user `nextjs`, tanpa berkas `.env` di dalam image; beranda, `/masuk`, model CREPE, dan font notasi membalas 200. | Lolos |

### NFR-15 Skalabilitas (setelah hosting tersedia)

| Pemeriksaan | Status |
|---|---|
| 20 pengguna (atau skrip beban) membuka daftar materi dan halaman latihan bersamaan tanpa galat | Ditunda sampai deploy |
| 20 pengguna menyimpan hasil analisis dalam rentang 1 menit; semua tersimpan, kuota tetap benar | Ditunda sampai deploy |

Catatan: pembatas percobaan per IP (mis. 20 percobaan masuk per 15 menit) dapat tercapai bila semua penguji memakai jaringan yang sama. Gunakan akun berbeda dan jeda antarpercobaan.

## Ditunda sampai Deploy

Uji berikut tidak dapat atau tidak bermakna dijalankan di localhost, dan dijalankan setelah aplikasi dihosting dengan HTTPS.

| ID | Uji | Alasan ditunda | Status |
|---|---|---|---|
| TD-01 | NFR-12: seluruh checklist kompatibilitas di Chrome Android | Localhost tidak dapat dibuka dari ponsel, dan mikrofon di ponsel membutuhkan HTTPS | Ditunda sampai deploy |
| TD-02 | NFR-02: waktu muat beranda, daftar materi, dan dashboard dari jaringan luar | Waktu muat di localhost tidak mencakup latensi jaringan dan CDN sebenarnya | Ditunda sampai deploy |
| TD-03 | NFR-08: uptime ≥ 95% per bulan | Membutuhkan hosting publik dan pemantauan | Ditunda sampai deploy |
| TD-04 | NFR-15: 20 pengguna aktif bersamaan | Membutuhkan server produksi; pembatas percobaan per IP perlu IP klien asli | Ditunda sampai deploy |
| TD-05 | Cookie sesi bertanda `Secure`, header HSTS, dan `upgrade-insecure-requests` | Ketiganya hanya aktif di produksi HTTPS | Ditunda sampai deploy |
| TD-06 | Tautan verifikasi email dan atur ulang kata sandi mengarah ke domain produksi | Membutuhkan `NEXT_PUBLIC_SITE_URL` dan Redirect URL Supabase untuk domain publik | Ditunda sampai deploy |
| TD-07 | Pembatas percobaan per IP memakai IP klien asli dari proxy hosting (`x-forwarded-for`) | Di localhost semua permintaan berasal dari satu IP | Ditunda sampai deploy |

## 3. Temuan Uji Otomatis

| ID | Sumber | Temuan | Usulan | Status |
|---|---|---|---|---|
| TM-01 | NFR-13, `responsif.spec.ts` | Halaman `/harga` pada lebar 360 px melebar menjadi 595 px. Penyebabnya 15 label pembaca layar (`sr-only`, `position: absolute`) di sel tabel perbandingan: pembungkus `overflow-x-auto` tidak `relative`, sehingga elemen absolut itu diposisikan terhadap halaman dan lolos dari wadah gulirnya. | Pembungkus tabel diberi `relative` (`components/publik/TabelPerbandingan.tsx`), begitu juga tujuh wadah gulir lain dengan pola yang sama (tabel admin, riwayat, nada meleset, filter materi). Diagnosis di `responsif.spec.ts` kini melaporkan elemen absolut yang lolos dari wadah gulir. `npm run test:e2e`: 17 lolos. | Diperbaiki |
| TM-02 | NFR-01, uji browser | Analisis pertama setelah halaman latihan dibuka butuh 18,1–18,9 dtk untuk rekaman 30 detik (batas 15 dtk); analisis berikutnya 8,6–9,6 dtk. Rincian analisis pertama: model 2,7 dtk + CREPE 14,5 dtk (±6 dtk lebih lambat dari analisis berikutnya) + DTW 0,03 dtk. Penyebabnya model dimuat dan TensorFlow.js/WebGL dipanaskan (kompilasi shader) saat analisis pertama. | Pemanasan model sebelumnya hanya memakai 1 bingkai, padahal analisis memakai batch 256 bingkai, sehingga shader WebGL tetap dikompilasi ulang saat analisis pertama. Perbaikan di `lib/audio/crepe.ts` dan `components/latihan/RuangLatihan.tsx`: pemanasan memakai batch penuh 256 bingkai; batch terakhir dipad nol agar bentuk tensor selalu sama; model dimuat dan dipanaskan di latar belakang begitu pengguna mulai merekam (bukan saat acuan diputar, agar audio tidak tersendat). Uji ulang: analisis pertama 8,9–12,0 dtk di Chrome, Edge, dan Firefox. | Diperbaiki |
| TM-03 | NFR-12, uji browser | Setelah masuk, console Chrome dan Edge mencatat galat `404` untuk `/dashboard?_rsc=…` (akun admin: `/admin?_rsc=…`). Penyebabnya prefetch Next.js untuk tautan "Daftar" yang masih tampil sesaat setelah masuk: proxy mengalihkan halaman tamu ke dashboard, lalu router mencari segmen `/daftar` di rute dashboard dan mendapat 404. Hal yang sama terjadi bila pengguna yang sudah masuk membuka halaman publik yang bertautan ke "Masuk" atau "Daftar". | Tautan ke `/masuk` dan `/daftar` (16 tautan di halaman publik dan auth) diberi `prefetch={false}`. Pemeriksaan sesi di `proxy.ts` tidak diubah. Uji ulang: 0 galat console di ketiga browser. | Diperbaiki |
