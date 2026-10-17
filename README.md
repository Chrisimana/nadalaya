<p align="center">
  <img src="public/nadalaya-logo.svg" alt="Logo Nadalaya" width="96" height="96">
</p>

<h1 align="center">Nadalaya</h1>

<p align="center">Website latihan vokal solfeggio dengan analisis nada otomatis untuk persiapan tes keterampilan musik.</p>

## Fitur Utama

- **Latihan per materi:** tangga nada, interval, dan melodi pendek.
- **Acuan MIDI dan notasi balok:** dengarkan acuan sambil membaca notasi.
- **Rekam suara di browser:** maksimal 60 detik, bisa didengar ulang dan direkam ulang.
- **Analisis nada otomatis:** memakai CREPE + DTW.
- **Hasil latihan:** skor 0–100, grafik nada nyanyian dibandingkan acuan, dan daftar nada yang meleset.
- **Paket Gratis:** kuota 3 analisis per hari.
- **Paket Premium:** membuka seluruh materi, riwayat latihan, dan grafik progres.

## Fitur AI

| Komponen | Fungsi |
|---|---|
| **CREPE** | Model *deep learning* (CNN) untuk mendeteksi nada dari rekaman suara. Berjalan langsung di browser dengan TensorFlow.js, sehingga **rekaman tidak pernah diunggah ke server**. Yang disimpan hanya hasil analisis. |
| **DTW** (*Dynamic Time Warping*) | Menyelaraskan nada nyanyian dengan nada acuan, sehingga tetap akurat walaupun tempo pengguna berbeda atau pengguna bernyanyi pada oktaf lain. Bagian rekaman di luar materi diabaikan. |

## Teknologi

| Bagian | Teknologi |
|---|---|
| Framework | Next.js (App Router, TypeScript) |
| Tampilan | Tailwind CSS |
| Back-end | Supabase (Auth, PostgreSQL dengan Row Level Security, Storage) |
| Analisis nada | TensorFlow.js (CREPE) |
| Audio dan MIDI | Tone.js, @tonejs/midi |
| Notasi dan grafik | VexFlow, Chart.js |

## Cara Menjalankan

**Prasyarat:** Node.js 20 atau lebih baru, serta proyek Supabase.

1. Pasang dependensi:

   ```bash
   npm install
   ```

2. Buat berkas `.env.local` di root proyek. Isi nilainya dari dashboard Supabase, menu **Project Settings → API Keys**:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
   SUPABASE_SECRET_KEY=
   ```

   `SUPABASE_SECRET_KEY` hanya dipakai di server. Jangan dibagikan dan jangan di-commit.

3. Di Supabase **SQL Editor**, jalankan `supabase/schema.sql`, lalu `supabase/seed.sql`.

4. Buka **Storage** dan pastikan ada bucket privat bernama `midi`. Bucket ini dibuat oleh `schema.sql`; jika belum ada, buat secara manual. Unggah kelima berkas dari `scripts/midi/` langsung ke bucket tersebut, bukan ke dalam folder.

5. Buka **Authentication → URL Configuration**, lalu isi:
   - Site URL: `http://localhost:3000`
   - Redirect URL: `http://localhost:3000/auth/konfirmasi`

   Tanpa pengaturan ini, tautan verifikasi email dan atur ulang kata sandi tidak berfungsi.

6. Jalankan server pengembangan:

   ```bash
   npm run dev
   ```

7. Buka <http://localhost:3000>.

> Mikrofon hanya dapat dipakai di `localhost` atau situs HTTPS.

| Perintah | Kegunaan |
|---|---|
| `npm run build` | Build produksi |
| `npm run lint` | Pemeriksaan kode |
| `npm test` | Uji analisis nada tanpa mikrofon |
| `npm run buat-midi` | Membuat ulang berkas MIDI contoh |

## Struktur Folder

```
app/            Halaman (publik, auth, pengguna, admin) dan API route
components/     Komponen antarmuka
lib/api/        Pemanggilan API dari sisi klien
lib/audio/      Perekam, acuan MIDI, notasi, CREPE, DTW, dan skor
lib/server/     Logika khusus server: sesi, paket, kuota, hak akses
supabase/       schema.sql dan seed.sql
scripts/        Pembuat berkas MIDI contoh dan hasilnya (scripts/midi/)
public/models/  Model CREPE untuk TensorFlow.js
tests/          Uji otomatis analisis nada
```

## Progres Fitur

| No | Fitur | Status |
|---|---|---|
| UC-01 | Mendaftar Akun | Berfungsi |
| UC-02 | Masuk ke Sistem | Berfungsi |
| UC-03 | Mengatur Ulang Kata Sandi | Berfungsi |
| UC-04 | Keluar dari Sistem | Berfungsi |
| UC-05 | Mengubah Profil | Berfungsi |
| UC-06 | Melihat Daftar Materi | Berfungsi |
| UC-07 | Menyaring Materi | Berfungsi |
| UC-08 | Memilih Materi Latihan | Berfungsi |
| UC-09 | Memeriksa Hak Akses dan Kuota | Berfungsi |
| UC-10 | Memutar Acuan MIDI dan Notasi | Berfungsi |
| UC-11 | Merekam Suara | Berfungsi |
| UC-12 | Menganalisis Akurasi Nada | Berfungsi |
| UC-13 | Menampilkan Skor dan Grafik Nada | Berfungsi |
| UC-14 | Melihat Riwayat Latihan | Berfungsi |
| UC-15 | Melihat Grafik Progres | Berfungsi |
| UC-16 | Mengaktifkan Uji Coba Premium | Tampilan saja |
| UC-17 | Membeli Paket Langganan | Tampilan saja |
| UC-18 | Memproses Pembayaran | Tampilan saja |
| UC-19 | Mengaktifkan Langganan | Belum |
| UC-20 | Melihat Data Materi (admin) | Tampilan saja |
| UC-21 | Menambahkan Data Materi | Tampilan saja |
| UC-22 | Mengubah Data Materi | Tampilan saja |
| UC-23 | Menghapus Data Materi | Tampilan saja |
| UC-24 | Melihat Data Pengguna | Tampilan saja |
| UC-25 | Menonaktifkan Akun Pengguna | Tampilan saja |
| UC-26 | Melihat Statistik Latihan | Tampilan saja |
| UC-27 | Melihat Laporan Transaksi | Tampilan saja |

**Ringkasan:** 15 dari 27 fitur berfungsi (**56%**), 11 fitur baru berupa tampilan, dan 1 fitur belum dikerjakan. Kesepuluh fitur esensial sudah berfungsi. Riwayat latihan dan grafik progres khusus Premium; selama uji coba dan pembayaran belum tersedia, paket Premium diaktifkan langsung melalui basis data.

## Rencana Berikutnya

1. Pembayaran paket dengan Midtrans
2. Uji coba Premium 7 hari
3. Penyempurnaan grafik progres
4. Fitur admin: kelola materi, kelola pengguna, statistik, dan laporan transaksi
5. SMTP email dengan alamat Nadalaya sendiri
6. Deploy
