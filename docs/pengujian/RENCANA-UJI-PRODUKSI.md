# Rencana Uji Nadalaya (Produksi)

Rencana pengujian untuk Nadalaya yang sudah di-deploy di **https://nadalaya-app.netlify.app**, terdiri atas:

1. **Smoke test alur utama** untuk memastikan fitur yang lolos di localhost juga berfungsi di produksi.
2. **Uji khusus produksi**: HTTPS, header keamanan, cookie, proxy, aset statis, pembatas percobaan, dan jadwal `pg_cron`.
3. **Uji yang ditunda** dari [RENCANA-UJI-LOCALHOST.md](RENCANA-UJI-LOCALHOST.md), dirujuk dengan ID aslinya.
4. **Uji pembayaran Midtrans**, ditunda sampai integrasi selesai.

Uji fungsional lengkap per use case tetap mengacu pada [RENCANA-UJI-LOCALHOST.md](RENCANA-UJI-LOCALHOST.md). Dokumen ini hanya memuat alur utama dan hal yang berbeda di produksi.

## Persiapan

| Kebutuhan | Keterangan |
|---|---|
| Alamat | https://nadalaya-app.netlify.app |
| Akses situs | Saat dokumen ini dibuat, situs dilindungi **Netlify Visitor access**: setiap permintaan (termasuk aset statis) dialihkan ke login tim Netlify. Penguji harus masuk ke akun Netlify tim terlebih dahulu, atau proteksi dimatikan di **Project configuration → Access & security → Visitor access** sebelum uji. Uji otomatis Playwright, pemantauan uptime, dan tautan email untuk pengguna di luar tim hanya dapat berjalan bila proteksi ini dimatikan. |
| Database | Migrasi 01–05 sudah dijalankan di Supabase, termasuk `supabase/migrasi-05-pembatas.sql` |
| Environment variables Netlify | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL=https://nadalaya-app.netlify.app` (tanpa garis miring di akhir), dan `SUPABASE_SECRET_KEY` |
| Supabase Auth | **Authentication → URL Configuration**: Site URL `https://nadalaya-app.netlify.app`, Redirect URL `https://nadalaya-app.netlify.app/auth/konfirmasi` |
| Akun uji | Email baru untuk pendaftaran, satu akun Gratis, satu akun Gratis yang belum pernah memakai uji coba, satu akun admin, dan satu akun yang akan dinonaktifkan. Gunakan email yang dapat dibuka penguji. |
| Perangkat | Laptop dengan mikrofon dan headphone (Chrome, Edge, Firefox) dan ponsel Android dengan Chrome |
| Alat | DevTools browser, `curl`, dan Supabase SQL Editor |
| Data uji | Materi uji yang ditambahkan admin dihapus kembali setelah uji |
| Pengisian status | **Lolos** atau **Gagal** dan tulis temuan di "Hasil aktual" |

## 1. Smoke Test Alur Utama

| ID | UC/NFR | Skenario | Langkah | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| SM-01 | UC-01 | Mendaftar akun | Buka `/daftar`, isi nama, email baru, dan kata sandi ≥ 8 karakter, lalu tekan Daftar | Diarahkan ke halaman cek email; email verifikasi diterima | | |
| SM-02 | UC-01, TD-06 | Domain tautan verifikasi | Buka email dari SM-01, salin tautan verifikasi (klik kanan → salin tautan), lalu periksa alamatnya | Tautan, atau parameter `redirect_to` di dalamnya, mengarah ke `https://nadalaya-app.netlify.app/auth/konfirmasi`; tidak ada `localhost` | | |
| SM-03 | UC-01 | Membuka tautan verifikasi | Buka tautan dari SM-02 | Diarahkan ke `/masuk?verifikasi=berhasil` dengan pemberitahuan "Email berhasil diverifikasi"; belum masuk otomatis | | |
| SM-04 | UC-02 | Masuk sebagai pengguna | Masuk dengan akun dari SM-01 | Diarahkan ke `/dashboard`; akun berstatus Gratis | | |
| SM-05 | UC-02 | Masuk sebagai admin | Masuk dengan akun admin | Diarahkan ke `/admin` | | |
| SM-06 | UC-04 | Keluar | Buka menu akun → Keluar → konfirmasi Keluar, lalu buka `/dashboard` | Kembali ke halaman publik; `/dashboard` dialihkan ke `/masuk` | | |
| SM-07 | UC-03, TD-06 | Lupa kata sandi | Buka `/lupa-kata-sandi`, isi email akun uji, lalu periksa tautan di email | Pesan umum bahwa tautan dikirim; tautan mengarah ke `https://nadalaya-app.netlify.app/auth/konfirmasi` | | |
| SM-08 | UC-03 | Atur ulang kata sandi | Buka tautan dari SM-07, isi kata sandi baru, lalu masuk dengan kata sandi baru | Halaman atur ulang terbuka; kata sandi berubah; masuk dengan kata sandi lama ditolak dan dengan yang baru berhasil | | |
| SM-09 | UC-03 | Tautan atur ulang dipakai ulang | Buka lagi tautan dari SM-07 | Pesan tautan tidak berlaku dan ajakan meminta tautan baru | | |
| SM-10 | UC-08, UC-10 | Membuka latihan | Akun Gratis membuka materi gratis dari `/materi`, lalu tekan Putar Acuan | Notasi balok tampil (kunci G dan kepala not); acuan berbunyi dan not tersorot berurutan | | |
| SM-11 | UC-11 | Merekam suara | Tekan Mulai merekam, izinkan mikrofon, nyanyikan materi, lalu tekan Berhenti merekam dan Dengarkan Ulang | Browser meminta izin mikrofon (HTTPS); rekaman dapat didengar ulang | | |
| SM-12 | UC-12, UC-13 | Analisis | Tekan Analisis | Skor 0–100, grafik nada, dan daftar nada meleset tampil; tidak ada permintaan berisi audio di tab Network | | |
| SM-13 | UC-09 | Kuota Gratis | Akun Gratis menganalisis sampai 3 kali dalam sehari, lalu mencoba analisis ke-4 | Sisa kuota berkurang setiap analisis; analisis ke-4 ditolak dengan "Kuota analisis hari ini sudah habis" dan keterangan kuota diperbarui pukul 00.00 WIB | | |
| SM-14 | UC-16 | Uji Coba Premium | Akun Gratis yang belum pernah memakai uji coba menekan tombol uji coba di `/langganan` | Status menjadi Uji Coba Premium dengan "Sisa 7 hari"; materi Premium terbuka; kuota tidak lagi dibatasi 3 | | |
| SM-15 | UC-14 | Riwayat Premium | Akun dari SM-14 berlatih, lalu membuka `/riwayat` | Latihan tercatat dengan skor dan tanggal; detail dapat dibuka | | |
| SM-16 | UC-15 | Progres Premium | Akun dari SM-14 dengan ≥ 2 latihan membuka `/progres` | Grafik progres skor per jenis materi tampil | | |
| SM-17 | UC-20, UC-21 | Admin: materi | Admin membuka `/admin/materi`, menambah materi uji dengan berkas `.mid` melodi tunggal, lalu membukanya sebagai pengguna Premium | Materi baru tampil; berkas tersimpan di bucket `midi`; acuan dapat diputar di halaman latihan | | |
| SM-18 | UC-22, UC-23 | Admin: ubah dan hapus materi | Ubah judul materi uji, lalu hapus | Perubahan tersimpan; materi tanpa riwayat terhapus, materi dengan riwayat dinonaktifkan | | |
| SM-19 | UC-24, UC-25 | Admin: pengguna | Buka `/admin/pengguna`, cari akun uji, buka detail, nonaktifkan, lalu aktifkan kembali | Detail sesuai; akun nonaktif tidak dapat masuk; setelah diaktifkan dapat masuk lagi | | |
| SM-20 | UC-26 | Admin: statistik | Buka `/admin/statistik` dengan rentang 30 hari | Jumlah sesi, rata-rata skor, materi terpopuler, pengguna aktif, dan grafik per hari memuat latihan dari smoke test ini | | |
| SM-21 | UC-27 | Admin: transaksi | Buka `/admin/transaksi` | Halaman terbuka; "Belum ada transaksi" selama Midtrans belum terintegrasi | | |
| SM-22 | UC-20 | Akses admin oleh pengguna biasa | Akun Gratis membuka `/admin`, lalu memanggil `fetch("/api/admin/materi")` dari Console DevTools | Halaman dialihkan ke `/dashboard`; API membalas 403 "Halaman ini khusus admin." | | |

## 2. Uji Khusus Produksi

| ID | UC/NFR | Skenario | Langkah | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| PR-01 | NFR-04, TD-05 | HTTP dialihkan ke HTTPS | `curl -sI http://nadalaya-app.netlify.app/` | Status 301 ke `https://nadalaya-app.netlify.app/` | | |
| PR-02 | TD-05 | Header keamanan di halaman | `curl -sI https://nadalaya-app.netlify.app/` | Ada `Content-Security-Policy` (memuat `upgrade-insecure-requests`, `connect-src` ke URL Supabase, tanpa `'unsafe-eval'`), `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, dan `Permissions-Policy` dengan `microphone=(self)`; tidak ada `X-Powered-By` | | |
| PR-03 | TD-05 | Header keamanan di aset dan pengalihan | `curl -sI` untuk `/models/crepe/model.json`, `/fonts/vexflow/bravura.woff2`, dan `/dashboard` tanpa cookie | Header yang sama seperti PR-02 muncul di aset; `/dashboard` membalas 307 ke `/masuk?lanjut=%2Fdashboard`. Catat bila header keamanan tidak ada pada respons pengalihan. | | |
| PR-04 | TD-05 | Cookie sesi `Secure` | Masuk, lalu buka DevTools → Application → Cookies | Cookie `sb-…-auth-token` bertanda `HttpOnly`, `Secure`, dan `SameSite=Lax` | | |
| PR-05 | – | Proxy: halaman terlindungi | Tanpa masuk, buka `/dashboard`, `/riwayat`, dan `/admin`; lalu masuk dari halaman yang muncul | Ketiganya dialihkan ke `/masuk?lanjut=…`; setelah masuk kembali ke halaman semula (`/admin` hanya untuk admin) | | |
| PR-06 | – | Proxy: halaman tamu dan peran | Saat sudah masuk, buka `/masuk` dan `/daftar` sebagai pengguna dan sebagai admin; pengguna biasa membuka `/admin` | Pengguna dialihkan ke `/dashboard`, admin ke `/admin`; pengguna biasa yang membuka `/admin` dialihkan ke `/dashboard` | | |
| PR-07 | – | Proxy: akun nonaktif | Admin menonaktifkan akun yang sedang masuk di browser lain, lalu pengguna itu membuka `/dashboard` | Dialihkan ke `/masuk?galat=nonaktif` dan keluar dari sesi | | |
| PR-08 | – | Muat ulang halaman dalam | Buka `/latihan/<id materi>` dan `/admin/pengguna/<id>` langsung dari bilah alamat, lalu muat ulang | Halaman tampil normal; tidak ada 404 dari Netlify | | |
| PR-09 | KS-11 | Pemeriksaan `Origin` | `curl -s -X POST https://nadalaya-app.netlify.app/api/auth/masuk -H "Origin: https://contoh.com" -H "Content-Type: application/json" -d "{}"` | 403 dengan pesan "Permintaan dari situs lain ditolak." | | |
| PR-10 | NFR-01, NFR-12 | Model CREPE termuat | Buka halaman latihan, rekam, lalu analisis sambil membuka tab Network | `model.json` dan 13 berkas shard model membalas 200; analisis selesai ≤ 15 detik untuk rekaman 30 detik | | |
| PR-11 | NFR-12 | Font notasi termuat | Buka halaman latihan sambil membuka tab Network dan Console | `bravura.woff2` dan `academico.woff2` membalas 200 dengan tipe font; notasi tampil benar; 0 pelanggaran CSP di Console | | |
| PR-12 | – | Kunci rahasia tidak sampai ke klien | Di DevTools → Sources, cari teks `sb_secret_` dan `SUPABASE_SECRET_KEY` di semua berkas | Tidak ditemukan | | |
| PR-13 | KS-05 | Pembatas per email antar-permintaan | Masuk dengan kata sandi salah 6 kali untuk email yang sama, dengan jeda beberapa detik | Percobaan ke-6 ditolak 429 "Terlalu banyak percobaan…"; nilai `Retry-After` menurun secara konsisten pada percobaan berikutnya (tidak kembali penuh seperti pembatas per instance) | | |
| PR-14 | KS-05 | Catatan pembatas tersimpan di Supabase | Setelah PR-13, jalankan di SQL Editor: `select count(*), max(waktu) from public.percobaan_pembatas;` | Jumlah catatan bertambah sesuai percobaan yang diterima; kolom `kunci` berisi hash, bukan email atau IP | | |
| PR-15 | KS-05 | Tidak memakai pembatas memori | Buka log fungsi di Netlify (**Logs & metrics → Functions**) setelah PR-13 | Tidak ada peringatan `[pembatas] … memakai pembatas memori` | | |
| PR-16 | NFR-05 | Tabel pembatas tertutup untuk klien | Sebagai pengguna yang sudah masuk, panggil dari Console: tabel `percobaan_pembatas` dan fungsi `catat_percobaan` lewat klien Supabase atau REST dengan publishable key | Tabel tidak terbaca dan fungsi ditolak (izin ditolak) | | |
| PR-17 | – | `pg_cron` terjadwal | Di SQL Editor: `select jobname, schedule, active from cron.job;` | Ada `perbarui-paket-kedaluwarsa` (`0 17 * * *`) dan `bersihkan-percobaan-pembatas` (`15 * * * *`), keduanya aktif | | |
| PR-18 | – | `pg_cron` berjalan | Sehari setelah deploy: `select j.jobname, d.status, d.start_time from cron.job_run_details d join cron.job j using (jobid) order by d.start_time desc limit 20;` | Kedua jadwal tercatat dengan status `succeeded`; `select count(*) from public.percobaan_pembatas where waktu < now() - interval '1 day';` bernilai 0 | | |
| PR-19 | UC-16 | Paket kedaluwarsa oleh `pg_cron` | Ubah `tanggal_berakhir` akun uji coba menjadi kemarin, lalu periksa setelah pukul 00.00 WIB berikutnya | Status akun kembali Gratis tanpa akun itu masuk lebih dulu | | |
| PR-20 | KS-15 | Log tanpa data pribadi | Setelah smoke test, periksa log fungsi di Netlify | Tidak ada email, kata sandi, token, atau kunci di log; galat hanya mencatat kode dan pesan | | |

## 3. Uji yang Ditunda dari Localhost

ID mengacu pada tabel "Ditunda sampai Deploy" di [RENCANA-UJI-LOCALHOST.md](RENCANA-UJI-LOCALHOST.md#ditunda-sampai-deploy).

| ID | UC/NFR | Skenario | Langkah | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| TD-01a | NFR-12 | Chrome Android: daftar, masuk, keluar | Di ponsel Android dengan Chrome, jalankan SM-01 sampai SM-06 | Semua langkah berhasil; tampilan tidak melebar | | |
| TD-01b | NFR-12 | Chrome Android: notasi dan acuan | Buka materi, putar acuan | Notasi tampil benar; acuan berbunyi dan not tersorot berurutan | | |
| TD-01c | NFR-12 | Chrome Android: izin dan perekaman mikrofon | Tekan Mulai merekam, izinkan mikrofon, rekam, lalu Dengarkan Ulang | Dialog izin muncul; rekaman dapat didengar ulang | | |
| TD-01d | NFR-12 | Chrome Android: analisis | Analisis rekaman ±30 detik | Skor dan grafik tampil; catat waktu analisis dan tipe ponsel | | |
| TD-01e | NFR-12 | Chrome Android: riwayat, progres, dan admin | Buka `/riwayat`, `/progres`, lalu halaman admin dengan akun admin | Halaman dapat dibaca tanpa scroll horizontal; tabel lebar dapat digulir | | |
| TD-01f | NFR-12 | Chrome Android: CSP | Sambungkan ponsel ke `chrome://inspect` di laptop, lalu periksa Console selama TD-01a–e | 0 pelanggaran CSP dan 0 galat console | | |
| TD-02 | NFR-02 | Waktu muat dari jaringan luar | DevTools → Network: *throttling* 10 Mbps dan *Disable cache*, lalu muat `/`, `/materi`, dan `/dashboard`; ulangi dengan uji otomatis (lihat bagian 5) | Ketiganya ≤ 3 detik | | |
| TD-03 | NFR-08 | Uptime ≥ 95% per bulan | Daftarkan `https://nadalaya-app.netlify.app/` ke layanan pemantau uptime (mis. UptimeRobot, interval 5 menit), lalu catat persentase setelah 30 hari | Uptime ≥ 95% | | |
| TD-04 | NFR-15 | 20 pengguna aktif bersamaan | 20 penguji (atau skrip beban) membuka daftar materi dan halaman latihan bersamaan, lalu menyimpan hasil analisis dalam rentang 1 menit | Tanpa galat; semua hasil tersimpan; kuota tetap benar. Penguji di jaringan yang sama berbagi batas 20 percobaan masuk per 15 menit per IP, jadi gunakan akun yang sudah masuk atau beri jeda. | | |
| TD-05 | NFR-04 | Cookie `Secure`, HSTS, dan `upgrade-insecure-requests` | Jalankan PR-01 sampai PR-04 | Sesuai hasil yang diharapkan PR-01 sampai PR-04 | | |
| TD-06 | UC-01, UC-03 | Tautan email mengarah ke domain produksi | Jalankan SM-02 dan SM-07 | Kedua tautan mengarah ke `https://nadalaya-app.netlify.app/auth/konfirmasi` | | |
| TD-07a | KS-05 | Pembatas per IP memakai IP klien asli | Dari jaringan A (mis. Wi-Fi), kirim 21 percobaan masuk dengan email berbeda dalam 15 menit; lalu segera coba dari jaringan B (mis. data seluler) | Percobaan ke-21 dari jaringan A ditolak 429; jaringan B tetap dilayani | | |
| TD-07b | KS-05 | IP tidak dapat dipalsukan | Setelah TD-07a, kirim lagi dari jaringan A dengan `curl` dan header `X-Forwarded-For: 203.0.113.9` | Tetap ditolak 429, karena IP dibaca dari `x-nf-client-connection-ip` yang diisi Netlify | | |

## 4. Uji Pembayaran Midtrans

Integrasi Midtrans belum dibuat. Uji di bawah dijalankan setelah integrasi selesai dan diuji di mode *sandbox* Midtrans.

| ID | UC/NFR | Skenario | Langkah | Hasil yang diharapkan | Hasil aktual | Status |
|---|---|---|---|---|---|---|
| TC-17-01 | UC-17 | Membeli paket langganan | – | – | Integrasi Midtrans belum dibuat | Ditunda |
| TC-18-01 | UC-18 | Memproses pembayaran (termasuk *signature key* tidak valid dan pembayaran kedaluwarsa) | – | – | Integrasi Midtrans belum dibuat | Ditunda |
| TC-19-01 | UC-19 | Mengaktifkan langganan setelah pembayaran berhasil | – | – | Integrasi Midtrans belum dibuat | Ditunda |
| NFR-06 | NFR-06 | Webhook Midtrans memverifikasi *signature key* dan dapat dijangkau dari internet | – | – | Integrasi Midtrans belum dibuat. Bila Visitor access Netlify masih aktif, webhook tidak dapat dijangkau Midtrans. | Ditunda |

## 5. Uji Otomatis terhadap Produksi

Uji Playwright untuk halaman publik dapat dijalankan terhadap situs produksi dengan variabel `BASE_URL`. Tanpa variabel ini, perilaku bawaannya tidak berubah: `npm run dev` dijalankan dan uji memakai http://localhost:3000.

| Perintah | Isi |
|---|---|
| `BASE_URL=https://nadalaya-app.netlify.app npm run test:e2e` | Seluruh uji Playwright: NFR-13 (responsif), NFR-02 (waktu muat beranda, batas 3 detik ditegakkan), dan NFR-11 (bahasa) terhadap 8 halaman publik |
| `BASE_URL=https://nadalaya-app.netlify.app npx playwright test tests/e2e/responsif.spec.ts` | Hanya NFR-13 |
| `BASE_URL=https://nadalaya-app.netlify.app npx playwright test tests/e2e/waktu-muat.spec.ts` | Hanya NFR-02 (bagian dari TD-02) |

Di PowerShell, isi variabelnya lebih dulu: `$env:BASE_URL = "https://nadalaya-app.netlify.app"; npm run test:e2e`, lalu hapus dengan `Remove-Item Env:BASE_URL`.

Selama Visitor access Netlify aktif, uji ini gagal karena Playwright membuka halaman login Netlify, bukan Nadalaya (terlihat dari `lang="en"` pada uji bahasa). Matikan proteksi itu dulu sebelum menjalankan uji otomatis.

## 6. Temuan Uji Produksi

| ID | Sumber | Temuan | Usulan | Status |
|---|---|---|---|---|
| | | | | |
