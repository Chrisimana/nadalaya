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

8. Untuk akun admin: daftar seperti biasa, lalu jalankan di SQL Editor:

   ```sql
   update public.users set peran = 'admin' where email = 'email-admin@contoh.com';
   ```

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
| 1 | Mendaftar Akun | Berfungsi |
| 2 | Masuk ke Sistem | Berfungsi |
| 3 | Mengatur Ulang Kata Sandi | Berfungsi |
| 4 | Keluar dari Sistem | Berfungsi |
| 5 | Mengubah Profil | Berfungsi |
| 6 | Melihat Daftar Materi | Berfungsi |
| 7 | Menyaring Materi | Berfungsi |
| 8 | Memilih Materi Latihan | Berfungsi |
| 9 | Memeriksa Hak Akses dan Kuota | Berfungsi |
| 10 | Memutar Acuan MIDI dan Notasi | Berfungsi |
| 11 | Merekam Suara | Berfungsi |
| 12 | Menganalisis Akurasi Nada | Berfungsi |
| 13 | Menampilkan Skor dan Grafik Nada | Berfungsi |
| 14 | Melihat Riwayat Latihan | Berfungsi |
| 15 | Melihat Grafik Progres | Berfungsi |
| 16 | Mengaktifkan Uji Coba Premium | Tampilan saja |
| 17 | Membeli Paket Langganan | Tampilan saja |
| 18 | Memproses Pembayaran | Tampilan saja |
| 19 | Mengaktifkan Langganan | Belum |
| 20 | Melihat Data Materi (admin) | Berfungsi |
| 21 | Menambahkan Data Materi | Berfungsi |
| 22 | Mengubah Data Materi | Berfungsi |
| 23 | Menghapus Data Materi | Berfungsi |
| 24 | Melihat Data Pengguna | Berfungsi |
| 25 | Menonaktifkan Akun Pengguna | Berfungsi |
| 26 | Melihat Statistik Latihan | Berfungsi |
| 27 | Melihat Laporan Transaksi | Berfungsi (menunggu data pembayaran) |

**Ringkasan:** 23 dari 27 fitur berfungsi (**85%**), 3 fitur baru berupa tampilan (uji coba, pembelian, dan pembayaran), dan 1 fitur belum dikerjakan. Kesepuluh fitur esensial dan seluruh fitur admin sudah berfungsi; laporan transaksi akan terisi setelah pembayaran tersedia. Riwayat latihan dan grafik progres khusus Premium; selama uji coba dan pembayaran belum tersedia, paket Premium diaktifkan langsung melalui basis data.

## Rencana Berikutnya

1. Pembayaran paket dengan Midtrans
2. Uji coba Premium 7 hari
3. Penyempurnaan grafik progres
4. SMTP email dengan alamat Nadalaya sendiri
5. Deploy
