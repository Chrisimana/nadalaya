# Nadalaya

Website latihan vokal **solfeggio** untuk persiapan tes keterampilan musik. Pengguna memilih materi (tangga nada, interval, atau melodi pendek), mendengarkan acuan MIDI sambil membaca notasi balok, lalu merekam nyanyiannya langsung dari browser. Sistem menilai akurasi nada memakai **CREPE** (deteksi pitch, TensorFlow.js) dan **Dynamic Time Warping** (penyelarasan dengan acuan). Hasilnya berupa skor 0–100, grafik pitch nyanyian dibandingkan acuan, dan daftar nada yang meleset lebih dari 50 cent.

Rekaman suara diproses di perangkat pengguna dan **tidak diunggah ke server** (NFR-07). Yang disimpan hanya hasil analisis.

Acuan dokumen: [SRS](docs/SRS_11241022.pdf) dan [SDD](docs/SDD%20_11241022.pdf) di folder `docs/`.

## Status proyek

**Langkah 3 – alur latihan berfungsi penuh.** Autentikasi, basis data, Storage MIDI, hak akses, kuota, dan profil memakai Supabase. Analisis nada (CREPE + DTW) berjalan di browser, lalu skor dan riwayat disimpan. Yang belum dikerjakan: uji coba Premium, pembayaran Midtrans, dan fitur admin.

Proyek ini tidak memakai data dummy. Fungsi `lib/api/` yang back-end-nya belum dibuat (admin, uji coba, pembelian) masih melempar `BelumTersambungError` dan ditandai `// TODO`.

## Teknologi

| Bagian | Teknologi |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack, Cache Components, `proxy.ts`) + React 19 |
| Bahasa & gaya | TypeScript, Tailwind CSS 4 |
| Basis data & autentikasi | Supabase (PostgreSQL, Auth, Storage, Row Level Security) via `@supabase/ssr` |
| Berkas MIDI | `@tonejs/midi` |
| Deteksi pitch | CREPE tiny (TensorFlow.js, backend WebGL), model lokal di `public/models/crepe/` |
| Pengujian | Vitest |
| Notasi balok | VexFlow 5 (font Bravura dibundel) |
| Pemutaran acuan | Tone.js |
| Perekaman | Web Audio API + MediaRecorder |
| Grafik | Chart.js + react-chartjs-2 |
| Ikon | lucide-react |
| Tahap berikutnya | Midtrans Snap, Docker |

## Cara menjalankan

Prasyarat: Node.js 20 atau lebih baru, npm, dan proyek Supabase.

```bash
npm install
npm run dev
```

Buka <http://localhost:3000>. Sebelum itu, selesaikan [Setup Supabase](#setup-supabase).

| Perintah | Kegunaan |
|---|---|
| `npm run dev` | Server pengembangan |
| `npm run build` | Build produksi |
| `npm run start` | Menjalankan hasil build |
| `npm run lint` | Pemeriksaan ESLint |
| `npm test` | Uji analisis nada tanpa mikrofon (Vitest) |
| `npm run buat-midi` | Membuat 5 berkas MIDI contoh di `scripts/midi/` |

## Setup Supabase

### 1. Variabel lingkungan

Buat berkas `.env.local` di folder proyek (berkas ini tidak ikut ke git):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
# Opsional, untuk tautan email di server produksi:
# NEXT_PUBLIC_SITE_URL=https://domain-anda.com
```

Nilainya ada di dashboard Supabase, **Project Settings → API Keys**. `SUPABASE_SECRET_KEY` hanya dipakai di server (`lib/supabase/admin.ts` ditandai `server-only`, sehingga build gagal bila berkas itu terimpor ke komponen klien).

### 2. Basis data

1. Buka **SQL Editor → New query**, salin seluruh isi [`supabase/schema.sql`](supabase/schema.sql), lalu **Run**.
2. Ulangi untuk [`supabase/seed.sql`](supabase/seed.sql).
3. Cek di **Table Editor**: tabel `materi_latihan` berisi 5 baris.

`schema.sql` membuat tabel `users`, `materi_latihan`, `sesi_analisis`, `riwayat_latihan`, dan `transaksi`, beserta trigger profil otomatis, fungsi status paket dan kuota, Row Level Security, dan bucket privat `midi`. Berkas ini aman dijalankan ulang.

### 3. Berkas MIDI

1. Jalankan `npm run buat-midi` (hasilnya sudah ada di `scripts/midi/`).
2. Buka **Storage → midi → Upload files**, lalu unggah kelima berkas `.mid` langsung ke bucket, bukan ke dalam folder.

### 4. Pengaturan Auth

Di **Authentication → URL Configuration**:

| Kolom | Isi |
|---|---|
| Site URL | `http://localhost:3000` (ganti dengan domain saat produksi) |
| Redirect URLs | `http://localhost:3000/auth/konfirmasi` |

**Disarankan:** ubah template email di **Authentication → Emails** agar tautan tetap berfungsi walau dibuka di browser atau perangkat lain.

| Template | Ganti `{{ .ConfirmationURL }}` dengan |
|---|---|
| Confirm signup | `{{ .SiteURL }}/auth/konfirmasi?token_hash={{ .TokenHash }}&type=email&next=/dashboard` |
| Reset password | `{{ .SiteURL }}/auth/konfirmasi?token_hash={{ .TokenHash }}&type=recovery&next=/atur-ulang-kata-sandi` |

Tanpa perubahan ini, tautan bawaan tetap didukung, tetapi tautan atur ulang kata sandi harus dibuka di browser yang sama dengan tempat permintaan dibuat.

### 5. Akun admin

1. **Authentication → Users → Add user → Create new user**, isi email dan kata sandi, centang **Auto Confirm User**.
2. Di SQL Editor jalankan (ganti emailnya):

   ```sql
   update public.users set peran = 'admin', nama = 'Admin Nadalaya'
   where email = 'email-admin@contoh.com';
   ```

## Mencoba aplikasi

1. Buka <http://localhost:3000/daftar>, daftar dengan email aktif, lalu buka tautan verifikasi di email.
2. Masuk di <http://localhost:3000/masuk>. Pengguna diarahkan ke `/dashboard`, admin ke `/admin`.
3. `/materi` menampilkan 5 materi. Tiga materi premium bergembok untuk akun Gratis.
4. Buka materi gratis: notasi dan acuan dimuat dari berkas MIDI (signed URL). Putar acuan, rekam nyanyian (maksimal 60 detik), lalu tekan **Analisis**.
5. Skor, grafik nada, dan nada meleset tampil. Hasil tersimpan sebagai riwayat dan kuota Gratis berkurang satu. Dashboard menampilkan skor terbaru.

**Mencoba fitur Premium** (riwayat dan progres) sebelum uji coba dan pembayaran tersedia: ubah paket akun lewat SQL Editor.

```sql
update public.users
   set status_paket = 'premium', tanggal_berakhir = now() + interval '30 days'
 where email = 'email-anda@contoh.com';
```

Kembalikan ke Gratis dengan `set status_paket = 'gratis', tanggal_berakhir = null`.

**Mencoba akun nonaktif:** `update public.users set is_aktif = false where email = '...';`. Saat masuk atau membuka halaman pengguna akan muncul pesan "Akun Anda telah dinonaktifkan".

**Status Pembayaran** (perlu masuk) dapat dilihat lewat parameter alamat, misalnya <http://localhost:3000/langganan/status?order_id=NDL-001&status=berhasil> (`berhasil`, `tertunda`, `gagal`, `kedaluwarsa`).

## Analisis nada

Seluruh analisis berjalan di browser; rekaman tidak pernah diunggah (NFR-07). Server hanya menerima skor, ringkasan kontur (20 titik/detik), dan nada meleset.

1. **Pra-proses** (`lib/audio/crepe.ts`): rekaman diubah menjadi mono 16 kHz dengan `OfflineAudioContext`, dipotong menjadi bingkai 1024 sampel dengan hop 10 ms, dan dinormalisasi per bingkai.
2. **CREPE**: inferensi per batch 256 bingkai dengan progres di layar. Frekuensi dari rata-rata berbobot cents di sekitar argmax; bingkai dengan confidence < 0,5 dianggap tanpa suara.
3. **Gagal** bila rekaman < 2 detik, bingkai bersuara < 20% (dihitung setelah hening awal/akhir dipotong) atau totalnya < 30% durasi acuan, atau model gagal dimuat. Sesi dibatalkan dan kuota tidak berkurang.
4. **Pembersihan kontur** (`lib/audio/kontur.ts`): hening di awal dan akhir dipotong, lonjakan oktaf sesaat dikoreksi ke oktaf tetangganya, lalu median filter.
5. **Penyelarasan** (`lib/audio/dtw.ts`): kedua deret diturunkan ke 20 bingkai/detik, nyanyian digeser kelipatan 12 semiton terdekat (toleransi oktaf), lalu **subsequence DTW**: seluruh acuan harus terpasang, tetapi boleh cocok dengan sebagian rekaman saja, sehingga nyanyian di luar materi (misalnya rekaman 49 detik untuk materi 10 detik) tidak memengaruhi skor. Pita Sakoe-Chiba diukur dari titik awal jalur.
6. **Skor** (`lib/audio/skor.ts`): median deviasi tiap nada acuan; nada meleset bila |deviasi| > 50 cent; skor nada 100 bila |deviasi| ≤ 20 cent, lalu turun linear hingga 0 pada 100 cent; skor akhir = rata-rata.

**Kinerja (NFR-01).** Konsol browser mencetak waktu tiap tahap, dengan format `[analisis] rekaman … dtk · model … dtk · CREPE … dtk · DTW+skor … dtk · total … dtk`. Buka DevTools → Console setelah menekan Analisis untuk memeriksa target ≤ 15 detik.

### Pengujian tanpa mikrofon

`npm test` menjalankan dua berkas uji:

| Berkas | Isi |
|---|---|
| `tests/analisis.test.ts` | Audio sinus sintetis dari `do-mayor.mid` → CREPE sungguhan (tfjs backend cpu) → DTW → skor |
| `tests/dtw-skor.test.ts` | Fungsi murni DTW, toleransi oktaf, skor, dan notasi dengan deret nada sintetis |

Hasil uji CREPE (target NFR-03):

| Skenario | Target | Hasil |
|---|---|---|
| Nada tepat | ≥ 80 | 100 |
| Digeser 1 semiton | ≤ 50 | 22 |
| Satu oktaf lebih rendah | ≥ 80 | 100 |
| Diapit hening dan nada acak di awal/akhir | ≥ 80 | 100 |
| Lonjakan oktaf 0,1 detik di tengah nada | ≥ 80 | 100 |
| Hening | gagal "nada tidak terdeteksi" | lolos |

Uji CREPE di Node memakai hop 50 ms karena backend cpu jauh lebih lambat daripada WebGL; prosesnya tetap sama. Seluruh uji selesai dalam beberapa menit.

## Perlindungan halaman dan API

- **`proxy.ts`** (pengganti `middleware.ts` di Next.js 16) menyegarkan sesi dan:
  - halaman `(pengguna)` wajib masuk, jika belum diarahkan ke `/masuk?lanjut=...`;
  - `/admin` wajib peran admin;
  - pengguna yang sudah masuk dan membuka `/masuk` atau `/daftar` diarahkan ke dashboard;
  - akun nonaktif langsung dikeluarkan.
- **Setiap API route** memvalidasi sesi login, status akun, dan status paket efektif di server (`lib/server/pengguna.ts`).
- **Row Level Security:** pengguna hanya membaca profil, sesi, riwayat, dan transaksinya sendiri, serta materi aktif. Profil hanya dapat diubah pada kolom `nama`. Penulisan sesi dan riwayat hanya lewat server dengan secret key.

### Daftar API route

| Metode | Alamat | Kegunaan |
|---|---|---|
| POST | `/api/auth/daftar`, `/masuk`, `/keluar` | Daftar, masuk (cek peran dan `is_aktif`), keluar |
| POST | `/api/auth/lupa-sandi`, `/atur-ulang-sandi`, `/kirim-ulang-verifikasi` | Atur ulang kata sandi dan verifikasi email |
| GET | `/auth/konfirmasi` | Tujuan tautan email (verifikasi dan atur ulang) |
| GET | `/api/materi` | Materi aktif, premium ditandai terkunci |
| POST | `/api/latihan/akses` | Cek premium dan kuota; mengembalikan materi dan signed URL MIDI |
| POST | `/api/sesi` | Cek ulang kuota, buat sesi `dimulai` |
| POST | `/api/sesi/[id]/batal` | Sesi menjadi `batal` |
| POST | `/api/sesi/[id]/hasil` | Simpan riwayat, sesi menjadi `selesai` |
| GET/PATCH | `/api/profil` | Baca profil, ubah nama |
| GET | `/api/paket` | Status paket efektif dan sisa kuota hari ini |
| GET | `/api/dashboard` | Ringkasan dashboard |
| GET | `/api/riwayat`, `/api/riwayat/[id]`, `/api/progres` | Khusus Premium dan Uji Coba |

## Struktur folder

```
app/
├─ layout.tsx                Pengaturan umum: font, metadata, html/body
├─ (publik)/                 Beranda, Harga, Tentang, Kebijakan Privasi, Syarat & Ketentuan
├─ (auth)/                   Masuk, Daftar, Lupa/Atur Ulang Kata Sandi, Verifikasi Email
├─ (pengguna)/               Dashboard, Materi, Latihan, Riwayat, Progres, Langganan, Profil
├─ (admin)/admin/            Dashboard admin, materi, pengguna, statistik, transaksi
├─ api/                      API route (lihat tabel di atas)
└─ auth/konfirmasi/          Penerima tautan email Supabase
proxy.ts                     Perlindungan halaman (Next.js 16)
components/                  ui/, layout/, auth/, akses/, latihan/, riwayat/, progres/, admin/, ...
lib/
├─ api/                      Lapisan data sisi klien: memanggil API route lewat klien.ts
├─ server/                   Khusus server: sesi login, status paket, kuota, akses, galat
├─ supabase/                 Klien Supabase: server.ts (cookie sesi), admin.ts (secret key)
├─ audio/                    recorder, usePerekam, acuan (Tone.js), midi, notasi,
│                            crepe, kontur, dtw, skor, analisis, useAnalisis
├─ types.ts  validasi.ts  waktu.ts  paket.ts  useMuat.ts  kontak.ts  utils.ts
supabase/
├─ schema.sql                Tabel, enum, trigger, fungsi, RLS, bucket Storage
└─ seed.sql                  5 materi latihan
public/models/crepe/         Model CREPE tiny (ml5-data-and-models, lisensi MIT)
tests/                       Uji Vitest analisis nada
scripts/
├─ buat-midi.mjs             Pembuat berkas MIDI contoh
└─ midi/                     Hasil: 5 berkas .mid
docs/                        SRS dan SDD
```

## Progres fitur (27 use case)

> **Keputusan:** riwayat latihan dan grafik progres hanya untuk pengguna Premium (termasuk Uji Coba). Pengguna Gratis tetap mendapat skor dan grafik nada setiap selesai latihan, dan skor terbarunya tampil di dashboard. Ketentuan ini berbeda dari SRS Tabel 2.3 versi 1.1.

Keterangan status:

- <img src="docs/ikon/berfungsi.svg" width="16" height="16" alt="Berfungsi"> **Berfungsi**: tersambung ke Supabase atau bekerja penuh di browser.
- <img src="docs/ikon/tampilan.svg" width="16" height="16" alt="Tampilan selesai"> **Tampilan selesai**: UI dan alur lengkap, menunggu mesin analisis, pembayaran, atau back-end admin.
- <img src="docs/ikon/belum.svg" width="16" height="16" alt="Belum dikerjakan"> **Belum dikerjakan**.

| No | Use Case | FR | Status | Keterangan |
|---|---|---|---|---|
| UC-01 | Mendaftar Akun | FR-01 | <img src="docs/ikon/berfungsi.svg" width="16" height="16" alt="Berfungsi"> | Supabase Auth `signUp`, profil Gratis dibuat trigger. Pesan "Email sudah terdaftar". Verifikasi email dan kirim ulang. |
| UC-02 | Masuk ke Sistem | FR-02 | <img src="docs/ikon/berfungsi.svg" width="16" height="16" alt="Berfungsi"> | Pesan "Email atau kata sandi salah" dan "Email belum diverifikasi". Akun nonaktif langsung dikeluarkan. Pengalihan sesuai peran. |
| UC-03 | Mengatur Ulang Kata Sandi | FR-03 | <img src="docs/ikon/berfungsi.svg" width="16" height="16" alt="Berfungsi"> | Tautan email lewat `/auth/konfirmasi`, simpan kata sandi baru, tampilan tautan kedaluwarsa. |
| UC-04 | Keluar dari Sistem | FR-02 | <img src="docs/ikon/berfungsi.svg" width="16" height="16" alt="Berfungsi"> | Dialog konfirmasi, sesi dihapus di server. |
| UC-05 | Mengubah Profil | FR-04 | <img src="docs/ikon/berfungsi.svg" width="16" height="16" alt="Berfungsi"> | Ubah nama (dibatasi RLS dan izin kolom), email dan status paket dari basis data. |
| UC-06 | Melihat Daftar Materi | FR-07 | <img src="docs/ikon/berfungsi.svg" width="16" height="16" alt="Berfungsi"> | Materi aktif dari `materi_latihan`, gembok untuk materi premium. |
| UC-07 | Menyaring Materi | FR-07 | <img src="docs/ikon/berfungsi.svg" width="16" height="16" alt="Berfungsi"> | Saring jenis dan tingkat pada data asli. Di luar 10 fitur target. |
| UC-08 | Memilih Materi Latihan | FR-07, FR-08 | <img src="docs/ikon/berfungsi.svg" width="16" height="16" alt="Berfungsi"> | Data materi dan berkas MIDI (signed URL) dimuat setelah pemeriksaan akses. |
| UC-09 | Memeriksa Hak Akses dan Kuota | FR-08, FR-09 | <img src="docs/ikon/berfungsi.svg" width="16" height="16" alt="Berfungsi"> | Di server: materi premium ditolak untuk Gratis, kuota 3 sesi selesai per hari (WIB), status paket efektif. |
| UC-10 | Memutar Acuan MIDI dan Notasi | FR-10 | <img src="docs/ikon/berfungsi.svg" width="16" height="16" alt="Berfungsi"> | Berkas MIDI dari Storage dibaca `@tonejs/midi` (nada dan tempo). Notasi VexFlow: kunci G, birama 4/4, kuantisasi not 1/1–1/8, beberapa baris responsif. Acuan Tone.js dengan tombol Putar dan Berhenti, berhenti otomatis saat merekam. |
| UC-11 | Merekam Suara | FR-10, FR-11 | <img src="docs/ikon/berfungsi.svg" width="16" height="16" alt="Berfungsi"> | Izin mikrofon, indikator level, berhenti otomatis 60 detik, dengarkan dan rekam ulang. Rekaman tidak diunggah. |
| UC-12 | Menganalisis Akurasi Nada | FR-09, FR-12, FR-13 | <img src="docs/ikon/berfungsi.svg" width="16" height="16" alt="Berfungsi"> | Cek ulang kuota dan sesi `dimulai` di server, lalu CREPE (TensorFlow.js) di browser dengan progres, toleransi oktaf, dan DTW. Kegagalan membatalkan sesi tanpa mengurangi kuota. |
| UC-13 | Menampilkan Skor dan Grafik Nada | FR-14, FR-15, FR-16 | <img src="docs/ikon/berfungsi.svg" width="16" height="16" alt="Berfungsi"> | Skor 0–100 dengan keterangan, grafik nada acuan vs nyanyian (Chart.js), daftar nada meleset (arah dan cent). Riwayat disimpan; bila gagal, skor tetap tampil. Latih Lagi dan Kembali ke Daftar Materi. |
| UC-14 | Melihat Riwayat Latihan | FR-16 | <img src="docs/ikon/berfungsi.svg" width="16" height="16" alt="Berfungsi"> | Khusus Premium dan Uji Coba: tabel riwayat dan detail dengan skor, grafik, dan nada meleset. |
| UC-15 | Melihat Grafik Progres | FR-17 | <img src="docs/ikon/berfungsi.svg" width="16" height="16" alt="Berfungsi"> | Khusus Premium: grafik skor per jenis materi dari riwayat. |
| UC-16 | Mengaktifkan Uji Coba Premium | FR-18 | <img src="docs/ikon/tampilan.svg" width="16" height="16" alt="Tampilan selesai"> | Tombol tersedia, API belum dibuat. |
| UC-17 | Membeli Paket Langganan | FR-19 | <img src="docs/ikon/tampilan.svg" width="16" height="16" alt="Tampilan selesai"> | Status paket dari basis data; pembelian menunggu Midtrans. |
| UC-18 | Memproses Pembayaran | FR-19, FR-20 | <img src="docs/ikon/tampilan.svg" width="16" height="16" alt="Tampilan selesai"> | Halaman status berhasil, tertunda, gagal, kedaluwarsa. Pop-up Snap menunggu integrasi. |
| UC-19 | Mengaktifkan Langganan | FR-20, FR-21 | <img src="docs/ikon/belum.svg" width="16" height="16" alt="Belum dikerjakan"> | Webhook Midtrans. Tabel `transaksi` sudah dibuat. |
| UC-20 | Melihat Data Materi (admin) | FR-05 | <img src="docs/ikon/tampilan.svg" width="16" height="16" alt="Tampilan selesai"> | Halaman terlindungi peran admin; data menunggu API admin. |
| UC-21 | Menambahkan Data Materi | FR-05 | <img src="docs/ikon/tampilan.svg" width="16" height="16" alt="Tampilan selesai"> | Form dan validasi klien. |
| UC-22 | Mengubah Data Materi | FR-05 | <img src="docs/ikon/tampilan.svg" width="16" height="16" alt="Tampilan selesai"> | Form dengan opsi ganti berkas. |
| UC-23 | Menghapus Data Materi | FR-05 | <img src="docs/ikon/tampilan.svg" width="16" height="16" alt="Tampilan selesai"> | Dialog konfirmasi. |
| UC-24 | Melihat Data Pengguna | FR-06 | <img src="docs/ikon/tampilan.svg" width="16" height="16" alt="Tampilan selesai"> | Tabel, pencarian, filter, detail. |
| UC-25 | Menonaktifkan Akun Pengguna | FR-06 | <img src="docs/ikon/tampilan.svg" width="16" height="16" alt="Tampilan selesai"> | Dialog konfirmasi. Pemblokiran akun nonaktif saat masuk sudah berfungsi. |
| UC-26 | Melihat Statistik Latihan | FR-22 | <img src="docs/ikon/tampilan.svg" width="16" height="16" alt="Tampilan selesai"> | Filter rentang tanggal, kartu statistik, grafik per hari. |
| UC-27 | Melihat Laporan Transaksi | FR-22 | <img src="docs/ikon/tampilan.svg" width="16" height="16" alt="Tampilan selesai"> | Filter tanggal dan status, total pendapatan. |

**Ringkasan:** 15 berfungsi, 11 tampilan selesai, 1 belum dikerjakan.

## Kebutuhan non-fungsional yang sudah diperhatikan

- **NFR-07 Privasi:** rekaman hanya berupa `Blob` di memori browser. Server hanya menerima skor, ringkasan kontur, dan nada meleset.
- **Keamanan:** secret key hanya di server, RLS pada semua tabel, bucket MIDI privat dengan signed URL 10 menit, validasi ulang semua input di server.
- **NFR-09 Keandalan:** sesi yang gagal ditandai batal agar kuota tidak berkurang. Jika riwayat gagal disimpan, sesi tetap `dimulai` dan pengguna mendapat pesan yang jelas.
- **NFR-10 Kemudahan:** alur latihan tiga langkah bernomor, kiat sebelum latihan di dashboard.
- **NFR-11 Bahasa:** seluruh antarmuka dan pesan galat (termasuk dari Supabase Auth) berbahasa Indonesia.
- **NFR-13 Responsif:** mobile-first untuk lebar 360–1920 px tanpa gulir horizontal.

## Rencana tahap berikutnya

1. Uji coba Premium 7 hari (`uji_coba_digunakan`).
2. Pembelian paket dan webhook Midtrans (verifikasi signature, perpanjangan `tanggal_berakhir`).
3. API admin: kelola materi (unggah MIDI ke Storage), kelola pengguna, statistik, laporan transaksi.
4. Jadwal harian `perbarui_paket_kedaluwarsa()` dengan pg_cron (opsional, ada di `schema.sql`).
5. Dockerfile dan docker-compose (NFR-14).
