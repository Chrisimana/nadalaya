<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Panduan AI Agent untuk Repo Nadalaya

Berkas ini dibaca oleh Claude Code sebelum bekerja di repo ini. Blok di atas dikelola otomatis oleh `next dev`, jangan diubah. Cara agent dipakai di setiap tahap pengembangan dijelaskan di [docs/AGENTIC-SDLC.md](docs/AGENTIC-SDLC.md).

## Konteks Proyek

Nadalaya adalah website latihan vokal solfeggio untuk persiapan tes keterampilan musik:

- **Latihan:** pengguna memilih materi, mendengarkan acuan MIDI sambil membaca notasi balok, lalu merekam nyanyian.
- **Analisis:** berjalan di browser dengan CREPE (TensorFlow.js) dan DTW. Rekaman tidak diunggah ke server, yang disimpan hanya hasilnya.
- **Paket:** Gratis dengan kuota 3 analisis per hari, uji coba Premium 7 hari, dan Premium.
- **Admin:** mengelola materi dan pengguna, serta melihat statistik dan transaksi.

| Bagian | Teknologi |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript, `cacheComponents`); `proxy.ts` menggantikan middleware |
| Tampilan | Tailwind CSS v4 |
| Back-end | Supabase: Auth, PostgreSQL dengan RLS, Storage (bucket privat `midi`) |
| Audio dan notasi | TensorFlow.js (CREPE), Tone.js, @tonejs/midi, VexFlow 5 (font disajikan dari `public/fonts/vexflow`) |
| Tes | Vitest |
| Runtime | Node.js 24.22.1 atau lebih baru (`.nvmrc`), Docker `node:24.22.1-alpine` |

## Struktur Folder

```
app/              Halaman (publik, auth, pengguna, admin) dan API route (app/api/**)
components/       Komponen antarmuka
lib/api/          Pemanggilan API dari sisi klien
lib/audio/        Perekam, acuan MIDI, notasi, CREPE, DTW, kontur, skor
lib/server/       Logika khusus server ("server-only"): sesi, paket, kuota, hak akses, respons
lib/supabase/     Klien Supabase (server, admin/secret key, env)
lib/*.ts          Modul murni yang bisa dites: keamanan, permintaan, pembatas, sesiAnalisis, dll.
supabase/         schema.sql, seed.sql, migrasi-NN-*.sql, audit-keamanan.sql
scripts/          Pembuat MIDI contoh dan penyalin font VexFlow
public/models/    Model CREPE
public/fonts/     Font notasi VexFlow beserta lisensinya (SIL OFL 1.1)
tests/            Tes otomatis (audio sintetis, DTW, validasi, keamanan); tests/e2e/ untuk Playwright
docs/             Dokumen (.md dan PDF): AGENTIC-SDLC.md, AUDIT-KEAMANAN.md, pengujian/, spesifikasi/ (SRS dan SDD, tidak ikut repo)
```

## Perintah

| Perintah | Kegunaan |
|---|---|
| `npm run dev` | Server pengembangan |
| `npm run build` | Build produksi (wajib lolos) |
| `npm run lint` | ESLint (wajib lolos) |
| `npm test` | Vitest (wajib lolos; tes CREPE butuh beberapa menit) |
| `npm run buat-midi` | Membuat ulang berkas MIDI contoh |
| `npm run salin-font` | Menyalin font VexFlow ke `public/fonts/vexflow` |
| `docker compose up --build` | Build dan jalankan image produksi di port 3000 |
| `docker compose down` | Menghentikan container |

## Aturan Kerja

1. **Tanpa git commit atau push.** Pengembang yang melakukan commit dan push. Agent cukup menyarankan pesan commit singkat dalam Bahasa Indonesia, misalnya `fix: ...`.
2. **Jangan membuka, menampilkan, atau mengubah `.env*`.** Jangan menulis kunci, token, atau kata sandi ke kode, dokumentasi, log, atau pesan.
3. **`SUPABASE_SECRET_KEY` hanya untuk server.** Kunci ini dipakai lewat `klienAdmin()` di berkas ber-`import "server-only"`, tidak boleh sampai ke klien, dan tidak boleh masuk image Docker.
4. **Quality gate.** Setiap perubahan wajib lolos `npm run build`, `npm run lint`, dan `npm test`. Laporkan hasilnya apa adanya, termasuk bila ada yang gagal.
5. **Database.**
   - Jangan mengubah `schema.sql` atau migrasi lama.
   - Perubahan skema dibuat sebagai berkas baru `supabase/migrasi-NN-*.sql` yang aman dijalankan ulang (`if not exists`, `create or replace`).
   - Migrasi dijalankan manual oleh pengembang di Supabase SQL Editor, jadi agent cukup memberi tahu kapan harus menjalankannya.
   - Fungsi SECURITY DEFINER wajib `set search_path = ''` dan hak eksekusinya dicabut dari `public`, `anon`, `authenticated`.
6. **Bahasa.** Teks antarmuka dan pesan galat memakai Bahasa Indonesia baku.
7. **Komentar kode** singkat dan hanya yang penting. Jangan menulis rujukan nomor kebutuhan di kode maupun README.
8. **Pekerjaan berisiko** (audit, perubahan keamanan, perubahan besar) dimulai dengan laporan atau rencana. Kode baru diubah setelah pengembang menyetujui.
9. **Keamanan yang sudah diterapkan jangan dilonggarkan tanpa alasan tertulis.** Lihat [docs/AUDIT-KEAMANAN.md](docs/AUDIT-KEAMANAN.md). Contohnya CSP, cookie `HttpOnly`, pemeriksaan `Origin`, batas ukuran body, dan pembatas percobaan.
10. **Next.js 16.** Baca panduan di `node_modules/next/dist/docs/` sebelum memakai API Next.js yang belum pernah dipakai di repo ini.
