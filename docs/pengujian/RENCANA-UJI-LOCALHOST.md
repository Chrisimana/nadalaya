# Rencana Uji Nadalaya (Localhost)

Rencana pengujian menyeluruh untuk prototype Nadalaya, terdiri atas:

1. **Uji fungsional black-box** per use case. Kolom "Hasil aktual" dan "Status" diisi penguji/pengembang.
2. **Uji kebutuhan non-fungsional**, sebagian otomatis dan sebagian manual.

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
| TC-01-01 | UC-01 | Data valid | Buka `/daftar`, isi nama, email baru, dan kata sandi ≥ 8 karakter, lalu tekan Daftar | Diarahkan ke halaman verifikasi email; email verifikasi diterima; akun baru berstatus Gratis | | |
| TC-01-02 | UC-01 | Email sudah terdaftar | Daftar dengan email yang sudah dipakai akun lain | Respons sama dengan pendaftaran berhasil (diarahkan ke halaman verifikasi) dan tidak ada akun ganda. *Catatan:* berbeda dari SRS ("Email sudah digunakan") karena keputusan keamanan KS-09. | | |
| TC-01-03 | UC-01 | Kata sandi kurang dari 8 karakter | Isi kata sandi 7 karakter | Pesan "Kata sandi minimal 8 karakter." di kolom kata sandi; data tidak dikirim | | |
| TC-01-04 | UC-01 | Input tidak valid | Kosongkan nama, isi email `nama@`, lalu tekan Daftar | Pesan pada kolom terkait ("Nama wajib diisi.", "Format email tidak valid. …") | | |
| TC-01-05 | UC-01 | Pendaftaran berulang | Kirim pendaftaran dengan email yang sama 4 kali dalam 1 jam | Percobaan ke-4 ditolak: "Terlalu banyak percobaan. Silakan coba lagi dalam … ." | | |
| TC-01-06 | UC-01 | Membuka tautan verifikasi yang sah | Setelah TC-01-01, buka tautan verifikasi di email | Diarahkan ke `/auth/terverifikasi` dengan judul "Email Anda berhasil diverifikasi" dan tombol "Masuk ke Dashboard"; tidak langsung ke dashboard | | |
| TC-01-07 | UC-01 | Lanjut setelah verifikasi | Pada halaman terverifikasi, tekan "Masuk ke Dashboard" | Dashboard terbuka tanpa diminta masuk lagi; akun berstatus Gratis | | |
| TC-01-08 | UC-01 | Halaman terverifikasi saat sudah masuk | Dalam keadaan sudah masuk, buka `http://localhost:3000/auth/terverifikasi` | Halaman tetap tampil; tidak dialihkan ke dashboard | | |
| TC-01-09 | UC-01 | Tautan verifikasi dipakai ulang atau kedaluwarsa | Buka lagi tautan verifikasi dari TC-01-06 | Diarahkan ke `/auth/verifikasi-gagal` dengan judul "Tautan verifikasi tidak berlaku", penjelasan bahwa tautan sudah kedaluwarsa atau sudah pernah dipakai, formulir kirim ulang, dan tautan Masuk | | |
| TC-01-10 | UC-01 | Tautan verifikasi tidak lengkap | Buka tautan verifikasi yang dipotong sebagian (mis. hapus beberapa karakter terakhir `token_hash`), lalu buka `/auth/konfirmasi` tanpa parameter | Keduanya diarahkan ke halaman "Tautan verifikasi tidak berlaku" dengan penjelasan yang sesuai; tidak ada galat 500 | | |
| TC-01-11 | UC-01 | Kirim ulang dari halaman galat | Di halaman galat, isi email akun yang belum diverifikasi, lalu tekan "Kirim Ulang Email Verifikasi" | Pesan bahwa tautan baru telah dikirim bila email terdaftar dan belum diverifikasi; tombol terkunci 60 detik; email baru diterima dan tautannya berlaku | | |
| TC-01-12 | UC-01 | Input tidak valid di halaman galat | Kosongkan kolom email atau isi `nama@`, lalu tekan kirim ulang | Pesan "Email wajib diisi." / "Format email tidak valid. …"; tidak ada permintaan ke server | | |
| TC-01-13 | UC-01 | Tautan dibuka di browser lain | Daftar di browser A, lalu buka tautan verifikasi di browser B | Bila sesi tidak dapat dibuat di browser B: halaman terverifikasi dengan tombol "Ke Halaman Masuk"; masuk dengan email dan kata sandi berhasil | | |

### UC-02 Masuk ke Sistem

| ID | UC | Skenario | Langkah | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| TC-02-01 | UC-02 | Data valid | Masuk dengan akun Gratis | Diarahkan ke `/dashboard` | | |
| TC-02-02 | UC-02 | Akun admin | Masuk dengan akun admin | Diarahkan ke `/admin` | | |
| TC-02-03 | UC-02 | Kata sandi salah atau email tidak terdaftar | Masuk dengan kata sandi salah, lalu dengan email yang tidak terdaftar | Keduanya menampilkan pesan yang sama: "Email atau kata sandi salah." | | |
| TC-02-04 | UC-02 | Email belum diverifikasi | Masuk dengan akun yang belum memverifikasi email | Pesan email belum diverifikasi dan pilihan kirim ulang verifikasi | | |
| TC-02-05 | UC-02 | Akun nonaktif | Masuk dengan akun yang dinonaktifkan admin | Pesan "Akun Anda telah dinonaktifkan."; tidak masuk | | |
| TC-02-06 | UC-02 | Percobaan berulang | Masuk dengan kata sandi salah 6 kali dalam 15 menit untuk email yang sama | Percobaan ke-6 ditolak dengan pesan "Terlalu banyak percobaan…" beserta waktu tunggu | | |
| TC-02-07 | UC-02 | Halaman terlindungi tanpa masuk | Buka `/riwayat` tanpa masuk, lalu masuk | Diarahkan ke `/masuk`; setelah masuk kembali ke `/riwayat` | | |
| TC-02-08 | UC-02 | Pengalihan ke situs luar | Buka `/masuk?lanjut=/%5Cevil.com`, lalu masuk | Diarahkan ke `/dashboard`, bukan ke situs luar | | |

### UC-03 Mengatur Ulang Kata Sandi

| ID | UC | Skenario | Langkah | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| TC-03-01 | UC-03 | Email terdaftar | Buka `/lupa-kata-sandi`, isi email terdaftar, buka tautan di email, lalu isi kata sandi baru | Kata sandi berubah; diminta masuk ulang dengan kata sandi baru | | |
| TC-03-02 | UC-03 | Email tidak terdaftar | Isi email yang tidak terdaftar | Pesan umum yang sama seperti TC-03-01 (tidak membocorkan keberadaan akun) | | |
| TC-03-03 | UC-03 | Tautan kedaluwarsa atau sudah dipakai | Buka tautan yang sama untuk kedua kalinya | Pesan tautan tidak berlaku dan ajakan meminta tautan baru | | |
| TC-03-04 | UC-03 | Tanpa tautan pemulihan | Dalam keadaan masuk biasa, buka `/atur-ulang-kata-sandi` dan kirim kata sandi baru | Ditolak: "Tautan atur ulang kata sandi sudah tidak berlaku." | | |
| TC-03-05 | UC-03 | Kata sandi baru tidak valid | Isi kata sandi baru 5 karakter | Pesan "Kata sandi minimal 8 karakter." | | |
| TC-03-06 | UC-03 | Alur pemulihan tidak ikut berubah | Buka tautan atur ulang kata sandi yang sah, lalu tautan yang sama untuk kedua kalinya | Tautan sah membuka `/atur-ulang-kata-sandi` (bukan halaman terverifikasi); tautan kedua menampilkan pesan tautan tidak berlaku di halaman atur ulang | | |

### UC-04 Keluar dari Sistem

| ID | UC | Skenario | Langkah | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| TC-04-01 | UC-04 | Keluar | Pilih Keluar pada menu akun, lalu konfirmasi | Sesi berakhir dan diarahkan ke halaman publik | | |
| TC-04-02 | UC-04 | Kembali setelah keluar | Setelah keluar, tekan tombol Back browser ke `/dashboard` | Diarahkan ke `/masuk` | | |

### UC-05 Mengubah Profil

| ID | UC | Skenario | Langkah | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| TC-05-01 | UC-05 | Nama valid | Buka `/profil`, ubah nama, lalu simpan | Nama baru tersimpan dan tampil di menu akun | | |
| TC-05-02 | UC-05 | Input tidak valid | Isi nama 1 karakter atau kosong | Pesan "Nama minimal 2 karakter." atau "Nama wajib diisi."; tidak tersimpan | | |

### UC-06 Melihat Daftar Materi

| ID | UC | Skenario | Langkah | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| TC-06-01 | UC-06 | Pengguna Gratis | Buka `/materi` | Materi dikelompokkan per jenis dan tingkat; materi Premium bertanda terkunci | | |
| TC-06-02 | UC-06 | Pengguna Premium | Buka `/materi` dengan akun Premium | Semua materi terbuka | | |
| TC-06-03 | UC-06 | Gagal memuat | Matikan koneksi, lalu muat ulang `/materi` | Pesan gagal memuat dan tombol Muat Ulang | | |

### UC-07 Menyaring Materi

| ID | UC | Skenario | Langkah | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| TC-07-01 | UC-07 | Saring jenis dan tingkat | Pilih jenis "Interval" dan tingkat "Dasar" | Hanya materi yang sesuai yang tampil | | |
| TC-07-02 | UC-07 | Tidak ada hasil | Pilih kombinasi yang tidak memiliki materi | Pesan "Materi tidak ditemukan" | | |

### UC-08 Memilih Materi Latihan

| ID | UC | Skenario | Langkah | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| TC-08-01 | UC-08 | Materi gratis | Pengguna Gratis memilih materi tangga nada | Halaman latihan terbuka dengan notasi | | |
| TC-08-02 | UC-08 | Materi Premium oleh pengguna Gratis | Pengguna Gratis membuka materi interval atau melodi (lewat daftar maupun URL langsung) | Halaman "Materi ini khusus Premium" dengan ajakan beralih ke Premium atau mengaktifkan uji coba; acuan MIDI tidak dimuat | | |
| TC-08-03 | UC-08 | Kuota Gratis habis | Setelah 3 analisis selesai hari ini, buka halaman latihan mana pun | Halaman latihan terblokir: "Kuota analisis hari ini sudah habis" dan waktu kuota diperbarui (00.00 WIB) | | |

### UC-09 Memeriksa Hak Akses dan Kuota

| ID | UC | Skenario | Langkah | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| TC-09-01 | UC-09 | Sisa kuota tampil | Akun Gratis dengan 1 analisis selesai membuka dashboard | Sisa kuota 2 | | |
| TC-09-02 | UC-09 | Cek ulang kuota saat Analisis | Dengan sisa kuota 1, buka halaman latihan di dua tab. Selesaikan analisis di tab A, lalu rekam dan tekan Analisis di tab B. | Tab B menampilkan "Kuota analisis hari ini sudah habis"; rekaman tidak dianalisis dan kuota tidak berkurang | | |
| TC-09-03 | UC-09 | Analisis lain sedang berjalan | Dengan sisa kuota 1, tekan Analisis di dua tab hampir bersamaan | Hanya satu yang berjalan; tab lain menampilkan pesan analisis lain sedang berjalan | | |
| TC-09-04 | UC-09 | Pengguna Premium | Lakukan lebih dari 3 analisis dengan akun Premium | Tidak ada batas kuota | | |
| TC-09-05 | UC-09 | Akun dinonaktifkan saat sedang masuk | Admin menonaktifkan akun yang sedang membuka halaman latihan, lalu pengguna menekan Analisis | Ditolak dengan pesan akun dinonaktifkan dan diarahkan ke halaman masuk | | |

### UC-10 Memutar Acuan MIDI dan Notasi

| ID | UC | Skenario | Langkah | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| TC-10-01 | UC-10 | Putar acuan | Tekan "Putar Acuan" | Acuan terdengar; not yang sedang diputar disorot di notasi | | |
| TC-10-02 | UC-10 | Notasi tampil benar | Buka setiap materi (tangga nada, interval, melodi) | Kunci G, birama, kepala not, tangkai, dan garis bantu tampil (bukan kotak kosong) | | |
| TC-10-03 | UC-10 | Berkas MIDI gagal dimuat | Matikan koneksi sebelum membuka halaman latihan | Pesan "Acuan gagal dimuat" dan tombol Muat Ulang | | |
| TC-10-04 | UC-10 | Audio diblokir browser | Blokir suara untuk situs di pengaturan browser, lalu tekan "Putar Acuan" | Petunjuk untuk mengizinkan pemutaran audio | | |

### UC-11 Merekam Suara

| ID | UC | Skenario | Langkah | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| TC-11-01 | UC-11 | Rekam normal | Tekan tombol rekam, bernyanyi 10 detik, lalu berhenti | Durasi tampil; rekaman bisa didengar ulang dan direkam ulang | | |
| TC-11-02 | UC-11 | Izin mikrofon ditolak | Tolak izin mikrofon saat diminta | Pesan "Izin mikrofon ditolak" dan petunjuk mengizinkan mikrofon | | |
| TC-11-03 | UC-11 | Lebih dari 60 detik | Rekam tanpa berhenti | Perekaman berhenti otomatis pada 1:00 | | |
| TC-11-04 | UC-11 | Kurang dari 2 detik atau tanpa suara | Rekam 1 detik, lalu rekam 5 detik tanpa bersuara | Pesan untuk merekam ulang; tombol Analisis tidak dapat dipakai; kuota tidak berkurang | | |

### UC-12 Menganalisis Akurasi Nada

| ID | UC | Skenario | Langkah | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| TC-12-01 | UC-12 | Analisis berhasil | Nyanyikan materi dengan benar, lalu tekan Analisis | Tahapan analisis tampil; hasil skor muncul; kuota Gratis berkurang 1 | | |
| TC-12-02 | UC-12 | Nada tidak terdeteksi | Rekam suara bising atau bisikan tanpa nada, lalu tekan Analisis | Pesan "Suara tidak terdeteksi, silakan rekam ulang"; kuota tidak berkurang | | |
| TC-12-03 | UC-12 | Model CREPE gagal dimuat | Di DevTools, blokir URL `/models/crepe/*`, lalu tekan Analisis | Pesan model gagal dimuat; sesi dibatalkan; kuota tidak berkurang | | |
| TC-12-04 | UC-12 | Sesi kedaluwarsa 15 menit | Lewat DevTools Console: kirim `POST /api/sesi` untuk mendapat `sesiId`, tunggu lebih dari 15 menit, lalu kirim `POST /api/sesi/{sesiId}/hasil` dengan data hasil yang sah | Ditolak (410): "Sesi analisis sudah kedaluwarsa (lebih dari 15 menit). Silakan analisis ulang."; riwayat tidak tersimpan dan kuota tidak berkurang | | |
| TC-12-05 | UC-12 | Input hasil tidak valid | Kirim `POST /api/sesi/{sesiId}/hasil` dengan `skor: 150`, lalu dengan `kontur` berisi `midi: 999` | Ditolak (400): "Skor tidak valid." / "Data hasil analisis tidak valid." | | |
| TC-12-06 | UC-12 | ID tidak valid | Kirim `POST /api/sesi` dengan `materiId: "abc"` | Ditolak (400): "ID materi tidak valid." | | |
| TC-12-07 | UC-12 | Hasil dikirim dua kali | Kirim ulang permintaan hasil yang sama untuk sesi yang sudah selesai | Ditolak (409): "Sesi analisis ini sudah selesai atau dibatalkan."; hanya satu riwayat tersimpan | | |
| TC-12-08 | UC-12 | Nyanyian beda oktaf atau tempo | Nyanyikan materi satu oktaf lebih rendah, lalu dengan tempo sedikit lebih cepat | Skor tetap tinggi (oktaf dan tempo tidak dihukum) | | |

### UC-13 Menampilkan Skor dan Grafik Nada

| ID | UC | Skenario | Langkah | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| TC-13-01 | UC-13 | Skor dan grafik | Setelah analisis berhasil | Skor 0–100, label kategori, grafik nada nyanyian terhadap acuan, dan daftar nada meleset | | |
| TC-13-02 | UC-13 | Riwayat gagal disimpan | Matikan koneksi setelah analisis selesai dan sebelum hasil tersimpan | Skor tetap tampil dengan pesan bahwa riwayat gagal disimpan; kuota tidak berkurang | | |

### UC-14 Melihat Riwayat Latihan

| ID | UC | Skenario | Langkah | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| TC-14-01 | UC-14 | Pengguna Premium | Buka `/riwayat`, lalu satu detail riwayat | Daftar latihan dan detail skor serta grafik | | |
| TC-14-02 | UC-14 | Pengguna Gratis | Buka `/riwayat` dengan akun Gratis | Ajakan beralih ke Premium | | |
| TC-14-03 | UC-14 | Belum ada riwayat | Akun Premium baru membuka `/riwayat` | Pesan "Belum ada latihan" dan tombol menuju daftar materi | | |
| TC-14-04 | UC-14 | Riwayat milik pengguna lain | Buka `/riwayat/{id}` milik akun lain | Riwayat tidak ditemukan; data orang lain tidak tampil | | |

### UC-15 Melihat Grafik Progres

| ID | UC | Skenario | Langkah | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| TC-15-01 | UC-15 | Pengguna Premium | Buka `/progres` setelah beberapa latihan | Grafik progres skor per jenis materi | | |
| TC-15-02 | UC-15 | Pengguna Gratis | Buka `/progres` dengan akun Gratis | "Grafik progres khusus Premium" dan ajakan beralih ke Premium | | |
| TC-15-03 | UC-15 | Data belum cukup | Akun Premium dengan 0–1 latihan membuka `/progres` | "Data belum cukup untuk menampilkan grafik" | | |

### UC-16 Mengaktifkan Uji Coba Premium

| ID | UC | Skenario | Langkah | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| TC-16-01 | UC-16 | Aktivasi pertama | Akun Gratis menekan tombol uji coba di `/langganan` | Status menjadi Uji Coba Premium; "Sisa 7 hari"; materi Premium terbuka | | |
| TC-16-02 | UC-16 | Sudah pernah dipakai | Akun yang pernah memakai uji coba membuka `/langganan` | Tombol uji coba tidak tampil; tersedia pilihan paket berbayar | | |
| TC-16-03 | UC-16 | Klik ganda | Tekan tombol uji coba dua kali dengan cepat | Uji coba hanya aktif sekali | | |
| TC-16-04 | UC-16 | Uji coba berakhir | Setelah masa uji coba lewat (atau ubah `tanggal_berakhir` di database uji) | Status kembali Gratis; dashboard menampilkan pemberitahuan uji coba berakhir | | |

### UC-17 s.d. UC-19 Pembayaran (Midtrans)

| ID | UC | Skenario | Langkah | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| TC-17-01 | UC-17 | Membeli paket langganan | – | – | Integrasi Midtrans belum dibuat | Ditunda |
| TC-18-01 | UC-18 | Memproses pembayaran (termasuk signature key tidak valid dan pembayaran kedaluwarsa) | – | – | Integrasi Midtrans belum dibuat | Ditunda |
| TC-19-01 | UC-19 | Mengaktifkan langganan setelah pembayaran berhasil | – | – | Integrasi Midtrans belum dibuat | Ditunda |

### UC-20 s.d. UC-23 Pengelolaan Materi (Admin)

| ID | UC | Skenario | Langkah | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| TC-20-01 | UC-20 | Melihat data materi | Admin membuka `/admin/materi`, mencari judul, dan menyaring jenis | Daftar materi sesuai pencarian dan saringan | | |
| TC-20-02 | UC-20 | Pengguna biasa membuka halaman admin | Akun Gratis membuka `/admin` dan `/admin/materi` | Diarahkan ke `/dashboard` | | |
| TC-20-03 | UC-20 | Pengguna biasa memanggil API admin | Akun Gratis memanggil `GET /api/admin/materi` dari DevTools | Ditolak (403): "Halaman ini khusus admin." | | |
| TC-21-01 | UC-21 | Menambah materi valid | Isi judul, jenis, tingkat, tempo, dan unggah berkas `.mid` melodi tunggal | Materi baru tampil di daftar admin dan daftar materi pengguna | | |
| TC-21-02 | UC-21 | Berkas bukan MIDI | Unggah berkas `.txt` yang diganti namanya menjadi `.mid` | Pesan "Berkas tidak dapat dibaca sebagai MIDI." | | |
| TC-21-03 | UC-21 | Berkas lebih dari 1 MB | Unggah berkas MIDI berukuran lebih dari 1 MB | Pesan "Ukuran berkas MIDI maksimal 1 MB." | | |
| TC-21-04 | UC-21 | MIDI berisi akor | Unggah MIDI dengan nada yang berbunyi bersamaan | Pesan bahwa berkas harus berisi melodi tunggal | | |
| TC-21-05 | UC-21 | Input tidak valid | Kosongkan judul atau isi tempo 300 | Pesan "Judul wajib diisi." / "Tempo harus bilangan bulat 40–240 BPM." | | |
| TC-22-01 | UC-22 | Mengubah materi | Ubah judul dan ganti berkas MIDI | Perubahan tersimpan; acuan baru dipakai di halaman latihan | | |
| TC-23-01 | UC-23 | Menghapus materi yang belum dipakai | Hapus materi tanpa sesi atau riwayat | Materi terhapus | | |
| TC-23-02 | UC-23 | Menghapus materi yang sudah dipakai | Hapus materi yang memiliki riwayat latihan | Materi dinonaktifkan (tidak dihapus); riwayat lama tetap ada | | |

### UC-24 dan UC-25 Pengelolaan Pengguna (Admin)

| ID | UC | Skenario | Langkah | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| TC-24-01 | UC-24 | Melihat data pengguna | Buka `/admin/pengguna`, cari nama atau email, saring paket, lalu buka detail | Daftar dan detail sesuai, termasuk latihan terakhir | | |
| TC-25-01 | UC-25 | Menonaktifkan akun | Nonaktifkan akun pengguna yang sedang masuk di browser lain | Akun nonaktif; pengguna langsung keluar pada aksi berikutnya dan tidak dapat masuk lagi | | |
| TC-25-02 | UC-25 | Menonaktifkan diri sendiri atau admin lain | Admin mencoba menonaktifkan akunnya sendiri atau akun admin lain | Ditolak: "Anda tidak dapat menonaktifkan akun Anda sendiri." / "Akun admin tidak dapat dinonaktifkan." | | |
| TC-25-03 | UC-25 | Mengaktifkan kembali | Aktifkan kembali akun yang dinonaktifkan | Pengguna dapat masuk lagi | | |

### UC-26 dan UC-27 Laporan (Admin)

| ID | UC | Skenario | Langkah | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| TC-26-01 | UC-26 | Statistik latihan | Buka `/admin/statistik` dengan rentang 30 hari | Jumlah sesi, rata-rata skor, materi terpopuler, pengguna aktif, dan grafik per hari | | |
| TC-26-02 | UC-26 | Rentang tanggal tidak valid | Isi tanggal akhir sebelum tanggal awal | Pesan "Tanggal akhir tidak boleh sebelum tanggal awal." | | |
| TC-27-01 | UC-27 | Laporan transaksi | Buka `/admin/transaksi` | "Belum ada transaksi" (data pembayaran belum tersedia karena Midtrans ditunda) | | |

## 2. Uji Kebutuhan Non-Fungsional

### Ringkasan

| NFR | Parameter | Metode | Alat / berkas | Hasil terakhir | Status |
|---|---|---|---|---|---|
| NFR-01 | Waktu analisis rekaman 30 detik ≤ 15 detik | Manual dengan log waktu + otomatis (sebagian) | Log `[analisis]` di Console (mode pengembangan); [tests/dtw-skor.test.ts](../../tests/dtw-skor.test.ts) | Penyelarasan dan skor 30 detik ±30 ms (Node). Total di browser belum diukur. | |
| NFR-02 | Halaman utama ≤ 3 detik pada 10 Mbps | Otomatis (beranda) + manual (daftar materi, dashboard) | [tests/e2e/waktu-muat.spec.ts](../../tests/e2e/waktu-muat.spec.ts) | Beranda 1.023 ms di mode pengembangan; batas ditegakkan hanya terhadap produksi | |
| NFR-03 | Tepat ≥ 80, meleset 1 semiton ≤ 50 | Otomatis | [tests/nfr.test.ts](../../tests/nfr.test.ts) (kelima materi), [tests/analisis.test.ts](../../tests/analisis.test.ts) (CREPE) | Lolos | |
| NFR-04 | Kata sandi ter-hash | Manual | Supabase Auth | – | |
| NFR-05 | RLS dan akses admin | Manual + otomatis (sebagian) | [supabase/audit-keamanan.sql](../../supabase/audit-keamanan.sql); TC-14-04, TC-20-02, TC-20-03 | – | |
| NFR-06 | Webhook Midtrans | – | – | – | Ditunda |
| NFR-07 | Rekaman tidak diunggah | Otomatis + manual | [tests/nfr.test.ts](../../tests/nfr.test.ts); tab Network DevTools | Lolos (otomatis) | |
| NFR-08 | Uptime ≥ 95% per bulan | – | Perlu hosting publik | – | Ditunda sampai deploy |
| NFR-09 | Kegagalan analisis jelas dan tidak mengurangi kuota | Otomatis (sebagian) + manual | [tests/nfr.test.ts](../../tests/nfr.test.ts); TC-11-04, TC-12-02, TC-12-03 | Lolos (otomatis) | |
| NFR-10 | Latihan pertama ≤ 5 menit tanpa bantuan | Manual | Checklist di bawah | – | |
| NFR-11 | Bahasa Indonesia | Otomatis (sebagian) + manual | [tests/e2e/bahasa.spec.ts](../../tests/e2e/bahasa.spec.ts), [tests/nfr.test.ts](../../tests/nfr.test.ts) | Lolos untuk 8 halaman publik | |
| NFR-12 | Chrome, Edge, Firefox, Chrome Android | Manual | Checklist di bawah | – | Desktop: di localhost; Chrome Android: Ditunda sampai deploy |
| NFR-13 | Tanpa scroll horizontal 360–1920 px | Otomatis | [tests/e2e/responsif.spec.ts](../../tests/e2e/responsif.spec.ts), tangkapan di [tests/e2e/tangkapan/](../../tests/e2e/tangkapan/) | Lolos untuk 8 halaman publik × 4 lebar, setelah TM-01 diperbaiki | Lolos |
| NFR-14 | Dibangun dan dijalankan dengan satu perintah | Manual | `docker compose up --build` | Pernah lolos (beranda, model CREPE, dan font dapat diakses) | |
| NFR-15 | 20 pengguna aktif bersamaan | Manual | Checklist di bawah | – | Ditunda sampai deploy |

### Cara menjalankan uji otomatis

| Perintah | Isi |
|---|---|
| `npm test` | Vitest: analisis nada (termasuk CREPE), DTW, validasi, keamanan, dan NFR-03/07/09/11 |
| `npm run test:e2e` | Playwright: NFR-13 (responsif), NFR-02 (waktu muat beranda), NFR-11 (bahasa). Secara bawaan menyalakan `npm run dev` dan memakai Microsoft Edge yang terpasang. |
| `E2E_BASE_URL=http://localhost:3000 npm run test:e2e` | Menguji server yang sudah berjalan, misalnya container Docker. Batas 3 detik NFR-02 hanya ditegakkan dalam mode ini. |
| `PW_CHANNEL= npm run test:e2e` | Memakai Chromium bawaan Playwright (pasang dulu dengan `npx playwright install chromium`) |

Tangkapan layar NFR-13 tersimpan di `tests/e2e/tangkapan/` dengan nama `<halaman>-<lebar>.png` (8 halaman × 4 lebar, ±7 MB). Folder ini tidak dilacak Git; jalankan `npm run test:e2e` untuk membuatnya ulang.

### NFR-01 Waktu Analisis (manual)

1. Jalankan `npm run dev`, lalu buka halaman latihan dengan DevTools Console terbuka.
2. Rekam nyanyian ±30 detik, lalu tekan Analisis.
3. Catat baris `[analisis] rekaman … · total … dtk (memenuhi/MELEBIHI batas 15 dtk)`. Log ini hanya muncul di mode pengembangan.
4. Ulangi 3 kali: sekali dengan cache kosong (model belum tersimpan) dan dua kali setelahnya. Lakukan di laptop dengan RAM 4 GB bila tersedia.

| Percobaan | Perangkat / browser | Durasi rekaman | Model | CREPE | DTW + skor | Total | Status |
|---|---|---|---|---|---|---|---|
| 1 (cache kosong) | | | | | | | |
| 2 | | | | | | | |
| 3 | | | | | | | |

### NFR-02 Waktu Muat (manual, halaman yang perlu masuk)

Di DevTools, buka tab Network, pilih *throttling* khusus 10 Mbps, centang *Disable cache*, lalu muat ulang halaman. Catat nilai **Load** di bilah status.

| Halaman | Waktu muat | Status |
|---|---|---|
| Beranda (`/`) | | |
| Daftar materi (`/materi`) | | |
| Dashboard (`/dashboard`) | | |

### NFR-04, NFR-05, NFR-07 Keamanan dan Privasi (manual)

| Pemeriksaan | Langkah | Hasil yang diharapkan | Status |
|---|---|---|---|
| Kata sandi ter-hash | Di Supabase, buka Authentication → Users; jalankan `select * from public.users limit 1` | Tidak ada kolom atau nilai kata sandi teks biasa di tabel aplikasi | |
| RLS dan hak akses | Jalankan `supabase/audit-keamanan.sql` bagian 1–6 | Sesuai "Harapan" di setiap bagian | |
| Rekaman tidak diunggah | Buka tab Network, rekam, lalu analisis | Tidak ada permintaan berisi audio; hanya JSON skor dan kontur ke `/api/sesi/…/hasil` | |

### NFR-10 Kegunaan (manual)

Minta 3 orang yang belum pernah memakai Nadalaya mendaftar, memilih materi, merekam, dan melihat skor tanpa bantuan. Catat waktunya.

| Peserta | Waktu sampai skor tampil | Kendala | Status (≤ 5 menit) |
|---|---|---|---|
| 1 | | | |
| 2 | | | |
| 3 | | | |

### NFR-11 Bahasa (manual)

| Pemeriksaan | Status |
|---|---|
| Semua halaman pengguna dan admin tidak memuat teks berbahasa Inggris | |
| Semua pesan galat (jaringan putus, mikrofon ditolak, kuota habis) berbahasa Indonesia | |
| Email verifikasi dan atur ulang kata sandi berbahasa Indonesia (templat email di Supabase) | |

### NFR-12 Kompatibilitas Browser (manual)

Isi dengan Lolos, Gagal, atau keterangan singkat.

Kolom Chrome (Android) **Ditunda sampai deploy**: localhost hanya dapat dibuka dari laptop yang menjalankannya, dan browser ponsel hanya mengizinkan mikrofon lewat HTTPS.

| Fungsi | Chrome (desktop) | Edge (desktop) | Firefox (desktop) | Chrome (Android) |
|---|---|---|---|---|
| Daftar, masuk, keluar | | | | |
| Notasi tampil benar (kunci G, kepala not) | | | | |
| Putar acuan MIDI | | | | |
| Izin dan perekaman mikrofon | | | | |
| Dengarkan ulang rekaman | | | | |
| Analisis (model CREPE termuat) | | | | |
| Grafik skor, riwayat, dan progres | | | | |
| Halaman admin | | | | |
| Tidak ada pelanggaran CSP di Console | | | | |
| Versi browser | | | | |

### NFR-14 Pemeliharaan (manual)

| Pemeriksaan | Status |
|---|---|
| `docker compose up --build` berhasil dari folder bersih (setelah `git clone` dan mengisi `.env.local`) | |
| Beranda, `/models/crepe/model.json`, dan `/fonts/vexflow/bravura.woff2` dapat diakses dari container | |
| `docker compose down` menghentikan container | |

### NFR-15 Skalabilitas (manual, setelah hosting tersedia)

| Pemeriksaan | Status |
|---|---|
| 20 pengguna (atau skrip beban) membuka daftar materi dan halaman latihan bersamaan tanpa galat | |
| 20 pengguna menyimpan hasil analisis dalam rentang 1 menit; semua tersimpan, kuota tetap benar | |

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
