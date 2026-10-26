# Audit Keamanan Nadalaya

**Tanggal:** 27 Oktober 2026
**Cakupan:** kode di repositori (API route, autentikasi, proxy, konfigurasi, SQL, Docker), hasil `npm run build`, riwayat git, dan `npm audit`.
**Status:** Tahap 1, laporan saja. Belum ada kode yang diubah.

Database sungguhan di Supabase belum diperiksa langsung. Untuk itu, jalankan [`supabase/audit-keamanan.sql`](supabase/audit-keamanan.sql) di SQL Editor dan bandingkan hasilnya dengan "Harapan" di setiap bagian.

## Ringkasan

| Tingkat | Jumlah | Temuan |
|---|---|---|
| Tinggi | 1 | KS-01 |
| Sedang | 6 | KS-02 – KS-07 |
| Rendah | 8 | KS-08 – KS-15 |

| ID | Area | Judul | Risiko |
|---|---|---|---|
| KS-01 | API | Kuota harian 3 analisis bisa ditembus | **Tinggi** |
| KS-02 | Autentikasi | *Open redirect* lewat parameter `next` dan `lanjut` | Sedang |
| KS-03 | API | Sesi analisis tanpa batas waktu dan penyelesaian tidak atomik | Sedang |
| KS-04 | API | Ukuran body permintaan tidak dibatasi | Sedang |
| KS-05 | Autentikasi | Tidak ada pembatasan percobaan di aplikasi | Sedang |
| KS-06 | Autentikasi | Cookie sesi tidak `HttpOnly` dan tidak `Secure` | Sedang |
| KS-07 | Header | Header keamanan belum ada | Sedang |
| KS-08 | API | Rentang angka data hasil analisis tidak dibatasi | Rendah |
| KS-09 | Autentikasi | Pendaftaran membocorkan email yang sudah terdaftar | Rendah |
| KS-10 | Autentikasi | Ubah kata sandi tanpa cek akun aktif dan tanpa kata sandi lama | Rendah |
| KS-11 | API | Tidak ada pemeriksaan `Origin`/`Content-Type` (CSRF) | Rendah |
| KS-12 | Autentikasi | Alamat tautan email bisa diambil dari header `Host` | Rendah |
| KS-13 | Database | Hak eksekusi beberapa fungsi belum dicabut | Rendah |
| KS-14 | Unggah MIDI | Batas ukuran dicek setelah seluruh berkas dibaca | Rendah |
| KS-15 | Logging | Objek galat database dicatat utuh | Rendah |

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

### KS-08 · Rentang angka data hasil analisis tidak dibatasi

- **Area:** A. API route (validasi input)
- **Lokasi:** `bersihkan()` di [app/api/sesi/[id]/hasil/route.ts:15-35](app/api/sesi/[id]/hasil/route.ts#L15-L35)
- **Risiko:** Rendah
- **Deskripsi:**
  - **Sudah benar:** skor dibatasi 0–100, dan jumlah titik serta nada sudah dibatasi. Kolom tambahan dibuang.
  - **Belum dibatasi:** nilai di dalam kontur, acuan, dan nada meleset hanya dicek sebagai angka hingga. `midi` bisa `1e300`, `durasi` dan `waktu` bisa negatif, dan `urutan` bisa pecahan.
- **Dampak:** Grafik riwayat dan statistik bisa rusak atau tampil aneh. Tidak ada kebocoran data.
- **Usulan perbaikan:** Batasi `midi` 0–127, `waktu` 0–120 detik, `durasi` > 0 dan ≤ 60, `selisihCent` −2400 sampai 2400, dan `urutan` bilangan bulat ≥ 0.

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

### KS-12 · Alamat tautan email bisa diambil dari header `Host`

- **Area:** B. Autentikasi
- **Lokasi:** `alamatSitus()` di [lib/server/respons.ts:57-59](lib/server/respons.ts#L57-L59)
- **Risiko:** Rendah
- **Deskripsi:**
  - Bila `NEXT_PUBLIC_SITE_URL` kosong, `redirectTo` email dibentuk dari header `Host` permintaan, dan header itu bisa dipalsukan.
  - Supabase menolak alamat yang tidak ada di daftar Redirect URL, jadi dampaknya tertahan selama daftar itu tidak memakai *wildcard* luas.
- **Dampak:** Tautan verifikasi atau atur ulang sandi bisa mengarah ke domain penyerang bila daftar Redirect URL terlalu longgar.
- **Usulan perbaikan:** Wajibkan `NEXT_PUBLIC_SITE_URL` di produksi (gagal saat start bila kosong), dan pastikan daftar Redirect URL di Supabase hanya berisi alamat persis.

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

| Risiko | Alasan | Mitigasi yang ada atau diusulkan |
|---|---|---|
| **Skor bisa dipalsukan.** Skor dan kontur dihitung di browser (CREPE + DTW), sehingga pengguna yang paham bisa mengirim skor 100. | Analisis di browser adalah keputusan desain: rekaman tidak pernah diunggah ke server, demi privasi dan biaya. | Server memastikan sesi milik pengguna, berstatus `dimulai`, satu hasil per sesi, dan skor 0–100. Usulan KS-01 dan KS-03 menambah batas 15 menit dan kuota atomik. Skor hanya memengaruhi riwayat milik pengguna itu sendiri dan statistik admin. |
| **Access token tetap berlaku sampai kedaluwarsa** (±1 jam) setelah keluar. | Sifat JWT Supabase. | Akun nonaktif tetap ditolak karena setiap API membaca `is_aktif` dari database, dan admin juga memblokir akun di Supabase Auth. |
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

## Urutan perbaikan yang disarankan

1. **KS-01 + KS-03:** fungsi atomik `mulai_sesi`/`selesaikan_sesi` dan batas 15 menit (migrasi baru dan dua route).
2. **KS-02:** satu fungsi `jalurInternal()` beserta tes.
3. **KS-06 + KS-07:** cookie `HttpOnly`/`Secure` dan header keamanan. Uji di browser setelahnya.
4. **KS-04 + KS-11 + KS-14:** batas ukuran body dan pemeriksaan `Content-Type`/`Origin` di `bacaJson`/`rute`.
5. **KS-05:** pembatas percobaan.
6. **KS-08, KS-10, KS-12, KS-13, KS-15:** perbaikan kecil. KS-09 opsional.
