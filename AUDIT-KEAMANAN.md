# Audit Keamanan NadalayaDiperbaiki |Diperbaiki |Diperbaiki |Diperbaiki |Diperbaiki |Diperbaiki |

**Tanggal:** 27 Oktober 2026
**Cakupan:** kode di repositori (API route, autentikasi, proxy, konfigurasi, SQL, Docker), hasil `npm run build`, riwayat git, dan `npm audit`.
**Status:** Selesai. Kelima belas temuan sudah diperbaiki; sisa risikonya tercatat di [Risiko yang diterima](#risiko-yang-diterima). Perbaikan KS-01, KS-03, dan KS-13 baru aktif setelah [`supabase/migrasi-02-keamanan-sesi.sql`](supabase/migrasi-02-keamanan-sesi.sql) dijalankan, dan bagian opsional KS-14 setelah [`supabase/migrasi-03-bucket-midi.sql`](supabase/migrasi-03-bucket-midi.sql).

Database sungguhan di Supabase belum diperiksa langsung. Untuk itu, jalankan [`supabase/audit-keamanan.sql`](supabase/audit-keamanan.sql) di SQL Editor dan bandingkan hasilnya dengan "Harapan" di setiap bagian.

## Ringkasan

| Tingkat | Jumlah | Temuan |
|---|---|---|
| Tinggi | 1 | KS-01 |
| Sedang | 6 | KS-02 – KS-07 |
| Rendah | 8 | KS-08 – KS-15 |

| ID | Area | Judul | Risiko | Status |
|---|---|---|---|---|
| KS-01 | API | Kuota harian 3 analisis bisa ditembus | **Tinggi** | Diperbaiki |
| KS-02 | Autentikasi | *Open redirect* lewat parameter `next` dan `lanjut` | Sedang | Diperbaiki |
| KS-03 | API | Sesi analisis tanpa batas waktu dan penyelesaian tidak atomik | Sedang | Diperbaiki |
| KS-04 | API | Ukuran body permintaan tidak dibatasi | Sedang | Diperbaiki |
| KS-05 | Autentikasi | Tidak ada pembatasan percobaan di aplikasi | Sedang | Diperbaiki |
| KS-06 | Autentikasi | Cookie sesi tidak `HttpOnly` dan tidak `Secure` | Sedang | Diperbaiki |
| KS-07 | Header | Header keamanan belum ada | Sedang | Diperbaiki |
| KS-08 | API | Rentang angka data hasil analisis tidak dibatasi | Rendah | Diperbaiki |
| KS-09 | Autentikasi | Pendaftaran membocorkan email yang sudah terdaftar | Rendah | Diperbaiki |
| KS-10 | Autentikasi | Ubah kata sandi tanpa cek akun aktif dan tanpa kata sandi lama | Rendah | Diperbaiki |
| KS-11 | API | Tidak ada pemeriksaan `Origin`/`Content-Type` (CSRF) | Rendah | Diperbaiki |
| KS-12 | Autentikasi | Alamat tautan email bisa diambil dari header `Host` | Rendah | Diperbaiki |
| KS-13 | Database | Hak eksekusi beberapa fungsi belum dicabut | Rendah | Diperbaiki |
| KS-14 | Unggah MIDI | Batas ukuran dicek setelah seluruh berkas dibaca | Rendah | Diperbaiki |
| KS-15 | Logging | Objek galat database dicatat utuh | Rendah | Diperbaiki |

---

## Temuan

### KS-01 · Kuota harian 3 analisis bisa ditembus

- **Area:** A. API route (kuota dan kondisi balapan)
- **Lokasi:**
  - [app/api/sesi/route.ts](app/api/sesi/route.ts)
  - [app/api/sesi/[id]/hasil/route.ts](app/api/sesi/[id]/hasil/route.ts)
  - [lib/server/akses.ts](lib/server/akses.ts)
  - `jumlah_sesi_selesai_hari_ini` di [supabase/schema.sql](supabase/schema.sql)
- **Risiko:** **Tinggi**
- **Deskripsi:** Kuota hanya dicek saat sesi **dibuat**, dan yang dihitung hanya sesi berstatus `selesai`. Route hasil tidak mengecek kuota lagi. Ada tiga celah:
  1. Pengguna Gratis bisa membuka banyak sesi lebih dulu, misalnya 10 tab atau 10 permintaan paralel. Semuanya lolos karena belum ada sesi yang `selesai`. Setelah itu, kesepuluh hasilnya bisa dikirim dan semuanya tersimpan. Celah ini tidak butuh permintaan paralel: membuka 10 sesi berurutan sebelum menyelesaikan satu pun sudah cukup.
  2. Kuota dihitung dari `created_at` sesi, bukan dari waktu sesi selesai. Sesi yang dibuat kemarin lalu diselesaikan hari ini tidak terhitung ke kuota mana pun.
  3. Dua klik "Analisis" beruntun sama-sama lolos pengecekan, karena pengecekan dan pembuatan sesi tidak berada dalam satu transaksi.
- **Dampak:** Batas paket Gratis, pembeda utama dengan Premium, bisa dilewati tanpa alat khusus.
- **Usulan perbaikan:** Pindahkan logika ke fungsi database atomik (migrasi baru, SECURITY DEFINER, hanya untuk `service_role`):
  - `mulai_sesi(p_user, p_materi)`: kunci baris pengguna (`for update`), lalu hitung *sesi selesai hari ini* ditambah *sesi `dimulai` yang belum kedaluwarsa*. Tolak bila jumlahnya sudah 3.
  - `selesaikan_sesi(p_user, p_sesi, skor, kontur, nada)`: dalam satu transaksi, kunci sesi, pastikan miliknya, berstatus `dimulai`, dan berumur ≤ 15 menit. Hitung ulang kuota, lalu sisipkan riwayat dan ubah status menjadi `selesai`.
  - Tambahkan kolom `selesai_at` (atau hitung dari `riwayat_latihan.created_at`) agar kuota dihitung dari waktu selesai.
- **Status:** ✅ **Diperbaiki** (aktif setelah migrasi 02 dijalankan).
  - **Migrasi baru:** [supabase/migrasi-02-keamanan-sesi.sql](supabase/migrasi-02-keamanan-sesi.sql).
  - **Kolom `selesai_at`:** kolom baru di `sesi_analisis`. Untuk sesi lama, nilainya diisi dari `riwayat_latihan.created_at`. `jumlah_sesi_selesai_hari_ini` kini menghitung dari `selesai_at` sejak 00.00 WIB.
  - **`mulai_sesi(p_user, p_materi)`:**
    - Mengunci baris pengguna (`for update`) dan mengecek akun aktif, materi aktif, dan hak Premium.
    - Menandai batal sesi `dimulai` yang lebih dari 15 menit.
    - Untuk pengguna Gratis, menolak bila *sesi selesai hari ini + sesi `dimulai`* sudah mencapai 3. Pesannya `kuota_habis` bila 3 sesi sudah selesai, atau `sesi_berjalan` bila masih ada analisis yang berjalan.
    - Premium dan uji coba tidak dibatasi.
  - **`selesaikan_sesi(p_user, p_sesi, p_skor, p_kontur, p_nada)`:** dalam satu transaksi, mengunci pengguna dan sesi, mengecek kepemilikan, status `dimulai`, umur ≤ 15 menit, hak Premium, dan kuota (dihitung ulang). Setelah itu, fungsi ini menyimpan riwayat dan mengubah status menjadi `selesai` beserta `selesai_at`, hanya bila status masih `dimulai`.
  - **Route:** [app/api/sesi/route.ts](app/api/sesi/route.ts) dan [app/api/sesi/[id]/hasil/route.ts](app/api/sesi/[id]/hasil/route.ts) memanggil kedua fungsi itu lewat `klienAdmin()`. Galat database diterjemahkan oleh [lib/sesiAnalisis.ts](lib/sesiAnalisis.ts). Sebelum migrasi dijalankan, route membalas 503 "Fitur analisis sedang diperbarui", bukan 500.
  - **Tes:** [tests/sesi-analisis.test.ts](tests/sesi-analisis.test.ts) menguji pemetaan galat, termasuk saat migrasi belum dijalankan. Logika kuota dan kunci baris berada di database, jadi belum bisa dites tanpa Supabase.

### KS-02 · *Open redirect* lewat parameter `next` dan `lanjut`

- **Area:** B. Autentikasi dan pengalihan
- **Lokasi:**
  - `jalurAman()` di [app/auth/konfirmasi/route.ts:9-11](app/auth/konfirmasi/route.ts#L9-L11)
  - `tujuanAman()` di [components/auth/FormMasuk.tsx:37-42](components/auth/FormMasuk.tsx#L37-L42)
  - Proxy hanya mengisi `lanjut` dari jalur internal, jadi proxy sendiri aman.
- **Risiko:** Sedang
- **Deskripsi:** Kedua fungsi hanya menolak awalan `//`. Saya uji dengan pengurai URL standar (WHATWG), yang juga dipakai browser:

  | Masukan `next` | Hasil pengalihan |
  |---|---|
  | `/\evil.com` | `https://evil.com/` |
  | `/%09/evil.com` (tab) | `https://evil.com/` |
  | `/%0A/evil.com` (baris baru) | `https://evil.com/` |

  Di `/auth/konfirmasi`, pengalihan terjadi setelah token berhasil diverifikasi. Penyerang bisa memakai `token_hash` miliknya sendiri yang masih berlaku. Akibatnya korban masuk ke akun penyerang lalu dibawa ke situs luar.

  Di halaman masuk, `/masuk?lanjut=/%5Cevil.com` membawa korban ke situs luar setelah login. Pemeriksaannya sama persis, tetapi perilaku `router.replace` belum diuji di browser, jadi untuk halaman ini statusnya dugaan kuat.
- **Dampak:** *Phishing* dengan domain Nadalaya yang tampak sah, misalnya halaman palsu "sesi berakhir, masuk lagi".
- **Usulan perbaikan:** Buat satu fungsi bersama `jalurInternal(nilai)` yang dipakai di kedua tempat:
  - Tolak karakter kontrol dan `\`.
  - Uraikan dengan `new URL(nilai, "http://x")` dan pastikan `origin` tidak berubah.
  - Kembalikan `pathname + search + hash` saja.
  - Tambahkan tes untuk ketiga contoh di atas.
- **Status:** ✅ **Diperbaiki.**
  - **Fungsi bersama:** `jalurInternal()` di [lib/keamanan.ts](lib/keamanan.ts), dipakai di [app/auth/konfirmasi/route.ts](app/auth/konfirmasi/route.ts) dan [components/auth/FormMasuk.tsx](components/auth/FormMasuk.tsx).
  - **Cara kerja:** menolak karakter kontrol dan *backslash*, mengurai jalur dengan `new URL()`, dan memastikan asal URL tidak berubah. Yang dikembalikan hanya `pathname + search + hash`. Halaman masuk tetap tidak mengarahkan ke `/admin`.
  - **Tes:** [tests/keamanan.test.ts](tests/keamanan.test.ts) mencakup `/\evil.com`, `/%09/evil.com`, `/%0A/evil.com`, `//evil.com`, `https://evil.com`, dan `javascript:`. Jalur sah seperti `/dashboard?tab=1` tetap diterima.
  - **Uji di server:** tautan dengan token sah dan `next=/\evil.com` dialihkan ke `/dashboard`.

### KS-03 · Sesi analisis tanpa batas waktu dan penyelesaian tidak atomik

- **Area:** A. API route (kepercayaan pada klien)
- **Lokasi:** [app/api/sesi/[id]/hasil/route.ts:55-96](app/api/sesi/[id]/hasil/route.ts#L55-L96)
- **Risiko:** Sedang
- **Deskripsi:**
  - **Sudah benar:** sesi harus milik pengguna (`user_id`), berstatus `dimulai`, dan satu sesi hanya bisa punya satu hasil, dijamin `unique (sesi_id)` di `riwayat_latihan`.
  - **Belum ada:** batas umur sesi. Sesi berumur berhari-hari tetap diterima.
  - **Tidak atomik:** pengecekan status, penyimpanan riwayat, dan perubahan status menjadi `selesai` adalah tiga permintaan terpisah. Perubahan status juga tidak memfilter `status = 'dimulai'`, jadi sesi yang dibatalkan di antara langkah-langkah itu bisa berubah menjadi `selesai`.
- **Dampak:** Memperbesar celah KS-01 dan membuat data sesi tidak konsisten.
- **Usulan perbaikan:** Sudah tercakup oleh fungsi `selesaikan_sesi` di KS-01, dengan batas 15 menit. Pengecekan yang sama juga perlu dipasang di route batal.
- **Status:** ✅ **Diperbaiki** (aktif setelah migrasi 02 dijalankan).
  - **Route hasil:** `selesaikan_sesi` menolak sesi berumur lebih dari 15 menit (`sesi_kedaluwarsa`, 410). Pengecekan, penyimpanan riwayat, dan perubahan status kini satu transaksi dengan kunci baris. Status hanya berubah bila masih `dimulai`.
  - **Route batal:** [app/api/sesi/[id]/batal/route.ts](app/api/sesi/[id]/batal/route.ts) memakai fungsi baru `batalkan_sesi(p_user, p_sesi)`, yang hanya membatalkan sesi milik pengguna yang masih `dimulai`. Sesi milik orang lain atau yang tidak ada dibalas 404.
  - **Sesi lama:** sesi `dimulai` yang kedaluwarsa ditandai batal setiap kali pengguna memulai sesi baru.

### KS-04 · Ukuran body permintaan tidak dibatasi

- **Area:** A. API route (validasi input)
- **Lokasi:**
  - `bacaJson()` di [lib/server/respons.ts:34-42](lib/server/respons.ts#L34-L42)
  - `bacaFormMateri()` di [lib/server/materi-admin.ts:49-54](lib/server/materi-admin.ts#L49-L54)
- **Risiko:** Sedang
- **Deskripsi:**
  - `req.json()` dan `req.formData()` membaca seluruh body ke memori sebelum validasi apa pun.
  - Batas 3.000 titik kontur baru dicek setelah JSON selesai diurai.
  - API dikecualikan dari proxy, jadi batas bawaan 10 MB milik proxy juga tidak berlaku.
  - Route tanpa login ikut terdampak: `/api/auth/masuk`, `/daftar`, `/lupa-sandi`, dan `/kirim-ulang-verifikasi`.
- **Dampak:** Beberapa permintaan berukuran ratusan MB bisa menghabiskan memori container (Render paket kecil hanya punya 512 MB) sehingga layanan berhenti untuk semua pengguna.
- **Usulan perbaikan:**
  - Di `bacaJson`, tolak bila `Content-Length` lebih dari batas, lalu baca body secara streaming dan hentikan saat melewati batas. Usulan batas: 16 KB untuk route auth dan profil, 1 MB untuk hasil analisis.
  - Di unggah MIDI, cek `Content-Length` ≤ ±1,2 MB sebelum memanggil `formData()`.
- **Status:** ✅ **Diperbaiki.**
  - **`bacaJson(req, batas)`** di [lib/server/respons.ts](lib/server/respons.ts) memakai `bacaTeksTerbatas()` dari [lib/permintaan.ts](lib/permintaan.ts):
    - `Content-Length` di atas batas langsung ditolak 413 tanpa membaca body.
    - Body tanpa `Content-Length` dibaca secara streaming dan dihentikan begitu melewati batas.
  - **Batas:** 16 KB untuk semua route JSON (auth, profil, sesi, latihan), 1 MB untuk hasil analisis.
  - **Unggah MIDI:** lihat KS-14.
  - **Uji di container Docker:** body 20 KB ke `/api/auth/masuk` ditolak 413, baik dengan `Content-Length` maupun *chunked*.

### KS-05 · Tidak ada pembatasan percobaan di aplikasi

- **Area:** B. Autentikasi
- **Lokasi:** route di [app/api/auth/](app/api/auth/) dan [app/api/sesi/route.ts](app/api/sesi/route.ts)
- **Risiko:** Sedang
- **Deskripsi:**
  - Aplikasi sepenuhnya mengandalkan *rate limit* bawaan Supabase Auth. Batas itu dihitung per alamat IP.
  - Semua panggilan ke Supabase dikirim dari server Nadalaya, sehingga Supabase melihat satu IP untuk semua pengguna.
  - Akibatnya, satu penyerang yang menghabiskan batas itu ikut memblokir login dan pendaftaran semua pengguna lain.
  - Batas yang ada juga tidak dihitung per akun, sehingga tebakan kata sandi ke satu akun hanya dibatasi oleh batas global tersebut.
- **Dampak:** Penolakan layanan pada fitur akun, dan perlindungan terhadap tebakan kata sandi lemah.
- **Usulan perbaikan:**
  - Tambahkan pembatas di aplikasi, per IP (`x-forwarded-for` dari Render) dan per email. Contoh batas: masuk 5 kali per 15 menit per email dan 20 kali per 15 menit per IP; daftar, lupa sandi, dan kirim ulang 3 kali per jam per email.
  - Untuk satu *instance*, penyimpanan di memori sudah cukup. Untuk beberapa *instance*, gunakan tabel Supabase atau layanan seperti Upstash.
  - Batasi juga pembuatan sesi, misalnya 20 per jam per pengguna.
- **Status:** ✅ **Diperbaiki.**
  - **Pembatas:** pembatas berjendela geser di memori ([lib/pembatas.ts](lib/pembatas.ts)). Bila ada yang penuh, respons 429 dengan pesan "Terlalu banyak percobaan. Silakan coba lagi dalam N menit." dan header `Retry-After`. Percobaan yang ditolak tidak dihitung.

    | Route | Per email | Per IP |
    |---|---|---|
    | Masuk | 5 / 15 menit | 20 / 15 menit |
    | Daftar, lupa sandi, kirim ulang verifikasi | 3 / jam | 10 / jam |
    | Mulai sesi analisis | 20 / jam per pengguna | – |
  - **IP klien:** nilai pertama `x-forwarded-for`, lalu `x-real-ip`, lalu kunci bersama "tidak-diketahui". Nilainya harus berbentuk IP.
  - **Uji di container Docker:** percobaan ke-6 untuk satu email ditolak 429 (`Retry-After: 897`), sedangkan email lain dari IP yang sama tetap dilayani.
  - **Sisa risiko:** lihat [Risiko yang diterima](#risiko-yang-diterima). Pembatas hanya berlaku per *instance*, dan `x-forwarded-for` bisa dipalsukan bila proxy di depannya tidak menimpanya.

### KS-06 · Cookie sesi tidak `HttpOnly` dan tidak `Secure`

- **Area:** B. Autentikasi
- **Lokasi:**
  - [lib/supabase/server.ts](lib/supabase/server.ts)
  - [proxy.ts:19-29](proxy.ts#L19-L29)
  - Bawaan `@supabase/ssr`: `httpOnly: false`, tanpa `secure`.
- **Risiko:** Sedang
- **Deskripsi:**
  - Cookie berisi *access token* dan *refresh token* Supabase.
  - Cookie ini bisa dibaca JavaScript di halaman, padahal aplikasi tidak memakai klien Supabase di browser (semua lewat API route).
  - Tanpa CSP (KS-07), satu celah XSS saja cukup untuk mencuri sesi dan *refresh token*, yang berlaku sampai 400 hari.
- **Dampak:** Pengambilalihan akun bila ada XSS.
- **Usulan perbaikan:** Tambahkan `cookieOptions: { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" }` di kedua `createServerClient`. Setelah itu, uji ulang login, keluar, dan tautan email.
- **Status:** ✅ **Diperbaiki.**
  - **Opsi cookie:** `OPSI_COOKIE` di [lib/supabase/env.ts](lib/supabase/env.ts) (`httpOnly: true`, `sameSite: "lax"`) dipakai di [lib/supabase/server.ts](lib/supabase/server.ts) dan [proxy.ts](proxy.ts).
  - **`secure`:** aktif bila produksi **dan** `NEXT_PUBLIC_SITE_URL` memakai `https://`, sehingga Docker di `http://localhost` tetap bisa login di semua browser.
  - **Uji di server:** login sungguhan mengirim `Set-Cookie` dengan `HttpOnly` dan `SameSite`.

### KS-07 · Header keamanan belum ada

- **Area:** E. Header keamanan
- **Lokasi:** [next.config.ts](next.config.ts)
- **Risiko:** Sedang
- **Deskripsi:**
  - Tidak ada CSP, `frame-ancestors`, `X-Content-Type-Options`, `Referrer-Policy`, maupun `Permissions-Policy`.
  - Header `X-Powered-By: Next.js` masih dikirim.
  - Halaman latihan meminta izin mikrofon, jadi bisa disematkan di situs lain (*clickjacking*).
- **Dampak:** *Clickjacking*, tidak ada lapisan pertahanan bila ada XSS, dan informasi teknologi server ikut terbuka.
- **Usulan perbaikan:** Lihat [Usulan header keamanan](#usulan-header-keamanan) di bawah.
- **Status:** ✅ **Diperbaiki.**
  - **Header:** [next.config.ts](next.config.ts) memasang CSP, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, dan `Permissions-Policy` sesuai usulan, ditambah `poweredByHeader: false`.
  - **HSTS dan `upgrade-insecure-requests`:** hanya aktif di produksi HTTPS.
  - **Mode pengembangan:** CSP juga mengizinkan `'unsafe-eval'` dan `ws:`, yang dibutuhkan *hot reload*.
  - **Uji di server:** semua header muncul dan `X-Powered-By` tidak lagi dikirim.
  - **Belum diuji:** halaman latihan di browser sungguhan (putar MIDI, rekam, analisis) belum dicek. Periksa Console DevTools; tidak boleh ada pelanggaran CSP.

### KS-08 · Rentang angka data hasil analisis tidak dibatasi

- **Area:** A. API route (validasi input)
- **Lokasi:** `bersihkan()` di [app/api/sesi/[id]/hasil/route.ts:15-35](app/api/sesi/[id]/hasil/route.ts#L15-L35)
- **Risiko:** Rendah
- **Deskripsi:**
  - **Sudah benar:** skor dibatasi 0–100, dan jumlah titik serta nada sudah dibatasi. Kolom tambahan dibuang.
  - **Belum dibatasi:** nilai di dalam kontur, acuan, dan nada meleset hanya dicek sebagai angka hingga. `midi` bisa `1e300`, `durasi` dan `waktu` bisa negatif, dan `urutan` bisa pecahan.
- **Dampak:** Grafik riwayat dan statistik bisa rusak atau tampil aneh. Tidak ada kebocoran data.
- **Usulan perbaikan:** Batasi `midi` 0–127, `waktu` 0–120 detik, `durasi` > 0 dan ≤ 60, `selisihCent` −2400 sampai 2400, dan `urutan` bilangan bulat ≥ 0.
- **Status:** ✅ **Diperbaiki.**
  - **Lokasi baru:** validasi dipindah ke `validasiHasil()` di [lib/sesiAnalisis.ts](lib/sesiAnalisis.ts).
  - **Batas yang dipasang:**

    | Kolom | Batas |
    |---|---|
    | `midi` | 0–127; bilangan bulat untuk acuan dan nada meleset; pecahan atau `null` untuk kontur |
    | `waktu` | 0–300 detik |
    | `durasi` | > 0 dan ≤ 60 detik |
    | `selisihCent` | −2400 sampai 2400 atau `null` |
    | `urutan` | bilangan bulat 0–1000 |
    | `skor` | 0–100 |
  - **Lain-lain:** nilai `null`, kolom yang hilang, dan `Infinity` ditolak. Kolom asing dibuang.
  - **Penyesuaian dari usulan:** batas `waktu` dinaikkan dari 120 menjadi 300 detik. Waktu kontur dan nada memakai skala acuan, bukan skala rekaman, dan analisis masih menerima acuan sampai ±200 detik (60 detik rekaman dibagi porsi minimal 0,3). Batas 120 detik akan menolak hasil yang sah.
  - **Tes:** 10 kasus rentang di [tests/sesi-analisis.test.ts](tests/sesi-analisis.test.ts).

### KS-09 · Pendaftaran membocorkan email yang sudah terdaftar

- **Area:** B. Autentikasi
- **Lokasi:** [app/api/auth/daftar/route.ts:31-33](app/api/auth/daftar/route.ts#L31-L33)
- **Risiko:** Rendah
- **Deskripsi:**
  - Supabase sengaja mengembalikan pengguna tiruan (`identities: []`) untuk email yang sudah terdaftar, supaya keberadaan akun tidak bisa ditebak.
  - Kode ini mengubahnya kembali menjadi 409 "Email sudah terdaftar".
  - Pesan login sudah aman: "Email atau kata sandi salah" untuk kedua kasus.
- **Dampak:** Siapa pun bisa mengecek apakah sebuah email punya akun Nadalaya.
- **Usulan perbaikan:** Ini pilihan UX. Bila ingin aman, tampilkan pesan yang sama dengan pendaftaran berhasil ("Cek email Anda untuk verifikasi"). Pemilik email asli tetap tahu dari isi emailnya. Bila pesan yang jelas dianggap lebih penting, terima sebagai risiko.
- **Status:** ✅ **Diperbaiki.**
  - **Daftar:** [app/api/auth/daftar/route.ts](app/api/auth/daftar/route.ts) menjawab email yang sudah terdaftar dengan `{ perluVerifikasi: true }`, sama seperti pendaftaran baru, sehingga pengguna diarahkan ke halaman "cek email".
  - **Kirim ulang verifikasi:** route ini kini juga tidak meneruskan galat selain batas permintaan, seperti lupa sandi, agar status email tidak bisa ditebak dari sana.
  - **Uji di server:** daftar dengan email yang sudah ada membalas 200 `{"perluVerifikasi":true}`.

### KS-10 · Ubah kata sandi tanpa cek akun aktif dan tanpa kata sandi lama

- **Area:** B. Autentikasi (akun nonaktif)
- **Lokasi:** [app/api/auth/atur-ulang-sandi/route.ts](app/api/auth/atur-ulang-sandi/route.ts)
- **Risiko:** Rendah
- **Deskripsi:**
  - Route ini hanya memeriksa JWT (`getClaims`), tidak mengecek `is_aktif` seperti `wajibLogin()`.
  - Route ini juga menerima sesi biasa, bukan hanya sesi dari tautan pemulihan.
  - Akibatnya, siapa pun yang memegang sesi aktif bisa mengganti kata sandi tanpa kata sandi lama.
  - Semua API lain sudah menolak akun nonaktif lewat `wajibLogin()`, termasuk `/auth/konfirmasi` dan `/api/auth/masuk`.
- **Dampak:** Sesi yang tercuri bisa dipakai untuk mengunci pemilik akun. Akun nonaktif mungkin masih bisa mengganti kata sandinya selama *access token* belum kedaluwarsa (±1 jam).
- **Usulan perbaikan:**
  - Cek `is_aktif` lewat `ambilProfil`.
  - Batasi route ini ke sesi pemulihan: cek klaim `amr` berisi `recovery`/`otp`, atau simpan penanda singkat saat `/auth/konfirmasi` memproses `type=recovery`.
- **Status:** ✅ **Diperbaiki.**
  - **Pengecekan baru:** [app/api/auth/atur-ulang-sandi/route.ts](app/api/auth/atur-ulang-sandi/route.ts) mewajibkan akun aktif (`ambilProfil`) dan sesi pemulihan, yaitu klaim `amr` berisi `recovery` atau `otp` yang dibuat ≤ 30 menit lalu (`sesiPemulihan()` di [lib/keamanan.ts](lib/keamanan.ts)).
  - **Uji di Supabase:** login dengan kata sandi menghasilkan `amr` `password` (ditolak, 401), sedangkan tautan pemulihan menghasilkan `otp` (diterima, 200).
  - **Catatan:** sesi dari tautan verifikasi pendaftaran juga `otp`, jadi selama 30 menit sesi itu bisa mengganti sandi. Ini setara dengan pemulihan, karena keduanya membuktikan kepemilikan email.

### KS-11 · Tidak ada pemeriksaan `Origin`/`Content-Type` (CSRF)

- **Area:** A. API route
- **Lokasi:** `bacaJson()` di [lib/server/respons.ts](lib/server/respons.ts), dan semua route POST/PATCH/DELETE
- **Risiko:** Rendah
- **Deskripsi:**
  - `bacaJson` tidak mewajibkan `Content-Type: application/json`, sehingga formulir HTML `text/plain` dari situs lain bisa mengirim JSON yang sah.
  - Saat ini serangan itu tertahan oleh cookie `SameSite=Lax`.
  - Kecuali *login CSRF*: `/api/auth/masuk` tidak butuh cookie, jadi situs lain bisa membuat korban masuk ke akun penyerang.
- **Dampak:** Kecil selama `SameSite=Lax` tetap berlaku. Login CSRF bisa membuat korban berlatih di akun penyerang.
- **Usulan perbaikan:** Di `bacaJson`, wajibkan `Content-Type: application/json`. Di `rute()`, tolak metode non-GET bila header `Origin` ada dan berbeda dari alamat situs.
- **Status:** ✅ **Diperbaiki.**
  - **`Content-Type`:** `bacaJson` mewajibkan `application/json`; selain itu ditolak 415. Formulir HTML `text/plain` dari situs lain tidak bisa lagi mengirim JSON yang sah.
  - **`Origin`:** `rute()` menolak POST/PATCH/DELETE dengan 403 bila header `Origin` ada dan berbeda dari `NEXT_PUBLIC_SITE_URL`. Ini juga menutup login CSRF.
  - **Uji di container Docker:** `Origin: https://evil.com` ditolak 403, dan `text/plain` ditolak 415.
  - **Catatan:** di Docker lokal, buka situs lewat `http://localhost:3000`, bukan `127.0.0.1`. Origin yang berbeda dari alamat situs akan ditolak.

### KS-12 · Alamat tautan email bisa diambil dari header `Host`

- **Area:** B. Autentikasi
- **Lokasi:** `alamatSitus()` di [lib/server/respons.ts:57-59](lib/server/respons.ts#L57-L59)
- **Risiko:** Rendah
- **Deskripsi:**
  - Bila `NEXT_PUBLIC_SITE_URL` kosong, `redirectTo` email dibentuk dari header `Host` permintaan, dan header itu bisa dipalsukan.
  - Supabase menolak alamat yang tidak ada di daftar Redirect URL, jadi dampaknya tertahan selama daftar itu tidak memakai *wildcard* luas.
- **Dampak:** Tautan verifikasi atau atur ulang sandi bisa mengarah ke domain penyerang bila daftar Redirect URL terlalu longgar.
- **Usulan perbaikan:** Wajibkan `NEXT_PUBLIC_SITE_URL` di produksi (gagal saat start bila kosong), dan pastikan daftar Redirect URL di Supabase hanya berisi alamat persis.
- **Status:** ✅ **Diperbaiki.**
  - **Alamat situs:** `alamatSitus()` di [lib/keamanan.ts](lib/keamanan.ts) tidak lagi membaca header `Host`. Di pengembangan nilai bawaannya `http://localhost:3000`, sedangkan di produksi `NEXT_PUBLIC_SITE_URL` wajib berupa URL http(s) lengkap.
  - **Cek saat start:** [instrumentation.ts](instrumentation.ts) memeriksanya saat server start (bukan saat build). Saya uji: `next start` tanpa variabel ini gagal dengan pesan "NEXT_PUBLIC_SITE_URL wajib diisi di produksi".
  - **Docker Compose:** memakai `http://localhost:3000` bila variabel kosong.
  - **README:** contoh `.env.local` sudah memuat variabel ini.
  - **Tetap periksa:** daftar Redirect URL di Supabase harus berisi alamat persis.

### KS-13 · Hak eksekusi beberapa fungsi belum dicabut

- **Area:** F. Database
- **Lokasi:** [supabase/schema.sql](supabase/schema.sql)
- **Risiko:** Rendah
- **Deskripsi:** Semua fungsi sudah memakai `set search_path = ''`, dan `aktifkan_uji_coba` serta `perbarui_paket_kedaluwarsa` sudah dicabut dari `public`, `anon`, dan `authenticated`. Fungsi lain masih bisa dieksekusi siapa pun (hak bawaan PostgreSQL):

  | Fungsi | Jenis | Keterangan |
  |---|---|---|
  | `handle_new_user`, `handle_user_email_change` | SECURITY DEFINER, fungsi trigger | Tidak bisa dipanggil lewat RPC. Supabase Advisor tetap menandainya. |
  | `status_paket_efektif`, `jumlah_sesi_selesai_hari_ini`, `awal_hari_wib` | SECURITY INVOKER | Tunduk pada RLS, jadi pengguna hanya bisa melihat datanya sendiri. |
- **Dampak:** Hampir tidak ada saat ini. Permukaan serangan saja yang lebih luas dari perlu.
- **Usulan perbaikan:** Buat migrasi baru yang menjalankan `revoke execute ... from public, anon, authenticated` untuk kelima fungsi, lalu `grant execute ... to service_role` untuk tiga fungsi yang dipanggil server.
- **Status:** ✅ **Diperbaiki** (aktif setelah migrasi 02 dijalankan).
  - **Pencabutan:** migrasi 02 mencabut hak eksekusi `public`, `anon`, dan `authenticated` dari kelima fungsi ini, juga dari keempat fungsi baru (`mulai_sesi`, `selesaikan_sesi`, `batalkan_sesi`, `batalkan_sesi_kedaluwarsa`).
  - **Pemberian ke `service_role`:** `status_paket_efektif`, `jumlah_sesi_selesai_hari_ini`, `awal_hari_wib`, `mulai_sesi`, `selesaikan_sesi`, dan `batalkan_sesi`.
  - **SECURITY DEFINER:** semua fungsi baru yang SECURITY DEFINER memakai `set search_path = ''`.
  - **Tambahan setelah audit SQL:** migrasi 02 juga mencabut `TRUNCATE`, `TRIGGER`, dan `REFERENCES` dari `authenticated` di kelima tabel, serta hak eksekusi `set_updated_at`.
  - **Verifikasi:** jalankan bagian 5 dan 6 di [supabase/audit-keamanan.sql](supabase/audit-keamanan.sql). Kolom `anon_boleh` dan `authenticated_boleh` harus `false` untuk semua fungsi.

### KS-14 · Batas ukuran unggah MIDI dicek setelah seluruh berkas dibaca

- **Area:** H. Unggah MIDI admin
- **Lokasi:**
  - [lib/server/materi-admin.ts:45-88](lib/server/materi-admin.ts#L45-L88)
  - [lib/audio/validasiMidi.ts](lib/audio/validasiMidi.ts)
- **Risiko:** Rendah, karena hanya admin yang bisa mengunggah.
- **Deskripsi:** Bagian yang sudah aman dan yang belum:

  | Pemeriksaan | Status |
  |---|---|
  | Batas ukuran 1 MB | Ada, tapi baru dicek setelah seluruh berkas masuk memori |
  | Isi berkas | Diurai sebagai MIDI, bukan hanya dicek ekstensinya; wajib berisi nada dan melodi tunggal |
  | Nama berkas di Storage | Dibuat server (`slug(judul)-uuid8.mid`), nama asli tidak dipakai; *path traversal* tidak mungkin |
  | Batas ukuran bucket | 1 MB |
  | `allowed_mime_types` bucket | Belum diatur |
- **Dampak:** Akun admin yang dibajak bisa mengunggah body sangat besar (lihat KS-04).
- **Usulan perbaikan:** Cek `Content-Length` sebelum `formData()` (bagian dari KS-04). Opsional: atur `allowed_mime_types = '{audio/midi}'` pada bucket.
- **Status:** ✅ **Diperbaiki.**
  - **Cek ukuran lebih awal:** `bacaFormMateri()` memanggil `wajibUkuranForm()` sebelum `formData()`. Unggahan tanpa `Content-Length` ditolak 411, dan yang melewati ±1,2 MB ditolak 413. Browser selalu mengirim `Content-Length` untuk `FormData`.
  - **Opsional, sudah dibuat:** [supabase/migrasi-03-bucket-midi.sql](supabase/migrasi-03-bucket-midi.sql) membatasi bucket ke `audio/midi`, `audio/mid`, dan `audio/x-midi`.

### KS-15 · Objek galat database dicatat utuh

- **Area:** H. Logging
- **Lokasi:**
  - [lib/server/respons.ts:28](lib/server/respons.ts#L28)
  - [app/api/sesi/[id]/hasil/route.ts:82](app/api/sesi/[id]/hasil/route.ts#L82)
  - [lib/server/materi-admin.ts:108](lib/server/materi-admin.ts#L108)
- **Risiko:** Rendah
- **Deskripsi:**
  - Tidak ada log yang mencatat kata sandi, token, atau kunci rahasia.
  - Galat Auth hanya dicatat sebagai `code` dan `message`.
  - Galat database dicatat utuh, dan `details` PostgreSQL bisa memuat nilai data, misalnya ID atau email dari pelanggaran *constraint*.
  - Pesan ke pengguna tetap umum ("Terjadi kesalahan pada server"), jadi tidak ada kebocoran ke klien.
- **Dampak:** Data pribadi bisa muncul di log Render.
- **Usulan perbaikan:** Catat hanya `code` dan `message` untuk galat database.
- **Status:** ✅ **Diperbaiki.**
  - **`ringkasGalat()`** di [lib/permintaan.ts](lib/permintaan.ts) dipakai di `rute()`, unggah/hapus MIDI, *signed URL*, pembaruan paket, dan blokir akun admin.
  - **Isi log:** galat yang punya `code` (PostgreSQL, PostgREST, Storage, Auth) hanya dicatat `code` dan `message`; `details` dan `hint` tidak lagi tercatat. Galat program biasa tetap dicatat dengan *stack* agar bisa ditelusuri.

---

## Usulan header keamanan

Proyek memakai `cacheComponents` (Partial Prerendering). Menurut panduan Next.js 16, CSP berbasis *nonce* tidak cocok dengan PPR, jadi usulannya CSP statis. `script-src` tetap butuh `'unsafe-inline'` untuk skrip *inline* Next.js. Header lain tetap memberi perlindungan penuh.

Kebutuhan aplikasi yang sudah saya periksa:

| Kebutuhan | Sumber | Direktif |
|---|---|---|
| Berkas MIDI | `fetch` ke *signed URL* Supabase Storage | `connect-src` |
| Model CREPE | `/models/crepe` (same-origin) | `connect-src 'self'` |
| TensorFlow.js | *backend* WebGL lalu CPU; tidak memakai WASM | `'wasm-unsafe-eval'` tidak perlu |
| Tone.js | `Worker` dari `blob:` | `worker-src blob:` |
| Pemutaran rekaman | `URL.createObjectURL` | `media-src blob:` |
| Font | `next/font` di-*host* sendiri | `font-src 'self'` |

```ts
// next.config.ts (usulan, belum diterapkan)
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const produksi = process.env.NODE_ENV === "production";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${produksi ? "" : " 'unsafe-eval'"} blob:`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self' ${supabase}`,
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(produksi ? ["upgrade-insecure-requests"] : []),
].join("; ");

const headerKeamanan = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "microphone=(self), camera=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  // HSTS hanya di produksi HTTPS (Render). Jangan aktif di localhost.
  ...(produksi && process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://")
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]
    : []),
];

// di nextConfig:
// poweredByHeader: false,
// async headers() { return [{ source: "/:path*", headers: headerKeamanan }]; },
```

Setelah diterapkan, uji dengan DevTools Console: tidak boleh ada pelanggaran CSP di halaman latihan, saat memutar MIDI, saat merekam, dan saat analisis. Nilai `NEXT_PUBLIC_SUPABASE_URL` dibaca saat build, sama seperti di Docker.

---

## Risiko yang diterima

| Risiko | Alasan diterima | Mitigasi yang ada atau diusulkan |
|---|---|---|
| **Skor bisa dipalsukan.** Skor dan kontur dihitung di browser (CREPE + DTW), sehingga pengguna yang paham bisa mengirim skor 100. | Analisis di browser adalah keputusan desain: rekaman tidak pernah diunggah ke server, demi privasi dan biaya. | Server memastikan sesi milik pengguna, berstatus `dimulai`, satu hasil per sesi, dan skor 0–100. Usulan KS-01 dan KS-03 menambah batas 15 menit dan kuota atomik. Skor hanya memengaruhi riwayat milik pengguna itu sendiri dan statistik admin. |
| **Access token tetap berlaku sampai kedaluwarsa** (±1 jam) setelah keluar. | Sifat JWT Supabase. | Akun nonaktif tetap ditolak karena setiap API membaca `is_aktif` dari database, dan admin juga memblokir akun di Supabase Auth. |
| **Pembatas percobaan disimpan di memori** (KS-05). | Render paket gratis berjalan sebagai satu *instance*, jadi cukup. | Bila aplikasi berjalan di banyak *instance* atau sering *restart*, pindahkan catatan ke penyimpanan bersama (tabel Supabase atau Redis). Supabase Auth tetap punya batasnya sendiri. |
| **IP klien dari `x-forwarded-for`** (KS-05). | Satu-satunya sumber IP di belakang proxy Render. | Bila proxy tidak menimpa header ini, penyerang bisa memalsukan IP untuk melewati batas per IP. Batas per email tetap berlaku. Pengguna di balik satu NAT (mis. Wi-Fi kampus) berbagi batas per IP; 20 percobaan masuk per 15 menit dianggap cukup. |
| **CSP memakai `'unsafe-inline'` untuk skrip** (KS-07). | Partial Prerendering tidak mendukung CSP berbasis *nonce*. | Header lain tetap penuh. Cookie sesi sudah `HttpOnly` (KS-06), jadi XSS tidak bisa membaca token. |
| **Signed URL MIDI berlaku 10 menit.** | Cukup untuk memuat acuan dalam satu latihan. | Hanya diberikan setelah hak akses dan kuota diperiksa. |

---

## Yang sudah aman

| Pemeriksaan | Hasil |
|---|---|
| Sesi login di setiap API | Semua route non-auth memanggil `wajibLogin()`, yang memverifikasi JWT dengan `getClaims()` lalu membaca `is_aktif` dari database. |
| Route admin | Kesepuluh route di `app/api/admin/**` memanggil `wajibAdmin()`. Admin tidak bisa menonaktifkan dirinya sendiri atau admin lain. |
| IDOR | `riwayat/[id]`, `sesi/[id]/batal`, dan `sesi/[id]/hasil` selalu memfilter `user_id = uid` dari sesi; ID orang lain menghasilkan 404 atau tanpa efek. `admin/pengguna/[id]` khusus admin. |
| Validasi UUID | Semua parameter `[id]` dan `materiId` melewati `wajibUuid()`. |
| Pesan galat | Galat tak terduga selalu menjadi "Terjadi kesalahan pada server". Detail database tidak dikirim ke klien. |
| Satu hasil per sesi | Dijamin `unique (sesi_id)` di database. |
| Pesan login | "Email atau kata sandi salah" untuk email tak terdaftar maupun kata sandi salah. Lupa sandi selalu menjawab berhasil. |
| Akun nonaktif | Ditolak di proxy, semua API (`wajibLogin`), `/api/auth/masuk`, dan `/auth/konfirmasi`, serta diblokir di Supabase Auth. Pengecualian kecil: KS-10. |
| `SUPABASE_SECRET_KEY` | Hanya dibaca di [lib/supabase/admin.ts](lib/supabase/admin.ts) (`import "server-only"`). Pemakainya hanya route API dan `lib/server/*` (semuanya `server-only`). Tidak ada komponen yang mengimpor `lib/server` atau `supabase/admin`. |
| Hasil `npm run build` | Nama `SUPABASE_SECRET_KEY`, nilainya, dan pola `sb_secret_` **tidak ditemukan** di `.next/static`. Nilai kunci juga tidak ada di seluruh folder `.next`. |
| Riwayat git | `.env*` tidak pernah ter-commit (`.gitignore` sudah benar). Satu-satunya kecocokan pola `eyJ…` adalah hash integritas `sha512` di `package-lock.json`, bukan kunci. Tidak ada `sb_secret_` atau `sb_publishable_`. |
| Dependensi | `npm audit`: **0 celah**, termasuk dependensi produksi saja (`--omit=dev`). |
| Docker | Berjalan sebagai user `nextjs` (uid 1001). `.dockerignore` mengecualikan `.env*`. Saat build 24–25 Oktober, `SUPABASE_SECRET_KEY` tidak ditemukan di ENV image, riwayat layer, maupun berkas image. Docker Desktop mati saat audit ini, jadi pemeriksaan image tidak diulang. |
| Fungsi SECURITY DEFINER | Semua punya `search_path = ''`. `aktifkan_uji_coba` memakai kunci baris dan hanya bisa dipanggil `service_role`. |
| RLS dan grant (di berkas SQL) | RLS aktif di kelima tabel. `anon` dicabut semua haknya. `authenticated` hanya SELECT data sendiri dan UPDATE kolom `users.nama`. |
| Bucket `midi` | Privat (`public = false`), batas 1 MB, tanpa policy untuk `anon`/`authenticated`. Akses hanya lewat *signed URL* dari server setelah hak akses diperiksa. |
| Unggah MIDI | Isi diurai sebagai MIDI, dan nama berkas dibuat server (lihat KS-14). |
| Logging | Tidak ada kata sandi, token, atau kunci yang dicatat (lihat KS-15). |

---

## Urutan perbaikan

1. KS-01, KS-03, KS-08, KS-13: kuota dan sesi atomik, validasi rentang, hak eksekusi fungsi.
2. KS-02, KS-06, KS-07, KS-09, KS-10, KS-12: pengalihan, cookie, header keamanan, alur akun.
3. KS-04, KS-05, KS-11, KS-14, KS-15: batas body, pembatas percobaan, CSRF, unggah MIDI, log.

Semua temuan sudah diperbaiki. Sebelum deploy, jalankan migrasi 02 dan 03, lalu jalankan ulang [supabase/audit-keamanan.sql](supabase/audit-keamanan.sql) untuk memastikan database sesuai.
