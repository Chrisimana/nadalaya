# Agentic SDLC Nadalaya

Catatan tentang cara AI agent dipakai di setiap tahap siklus pengembangan Nadalaya, siapa yang mengambil keputusan, dan bagaimana hasilnya diverifikasi. Panduan teknis untuk agent yang bekerja di repo ini ada di [AGENTS.md](../AGENTS.md).

## 1. Ringkasan

Nadalaya dikembangkan dengan pendekatan *agentic SDLC*:

- **Pengembang (manusia):** pengambil keputusan dan penguji. Pengembang menetapkan kebutuhan, memilih desain, menjalankan langkah yang menyentuh layanan luar, menguji di browser, dan melakukan commit.
- **AI agent:** pelaksana dan peninjau. Agent menyusun rancangan, menulis kode dan tes, mengaudit, dan melaporkan hasilnya untuk diputuskan pengembang.

Setiap tahap kerja berakhir dengan *quality gate* otomatis (`npm run build`, `npm run lint`, `npm test`), lalu uji manual dan commit oleh pengembang.

## 2. Aktor dan Peran

| Aktor | Peran | Tidak melakukan |
|---|---|---|
| **Pengembang** | Menetapkan kebutuhan; memutuskan pilihan desain; menjalankan langkah manual (Supabase SQL Editor dan pengaturan, Docker Desktop, git commit/push); melakukan uji manual; menyetujui atau menolak usulan agent | – |
| **Claude (asisten chat)** | Meninjau konsistensi SRS–SDD; merancang tahapan kerja; menyusun prompt untuk agent; membuat diagram (use case, activity, sequence), logo, dan naskah video; meninjau hasil uji dan laporan audit | Tidak mengubah repo secara langsung |
| **Claude Code (agent coding di repo)** | Implementasi kode, migrasi SQL, tes otomatis, Docker, audit keamanan, dan dokumentasi berdasarkan prompt; menjalankan build, lint, dan tes; melaporkan hasil beserta saran pesan commit | Tidak melakukan commit/push, tidak membuka `.env*`, tidak menjalankan migrasi di database |

## 3. Alur per Tahap SDLC

### a. Perencanaan Prototype

| Aspek | Isi |
|---|---|
| Tujuan | Memenuhi target minimal 30% fitur esensial berfungsi |
| Peran agent | Claude mengusulkan cakupan dan urutan kerja |
| Keputusan manusia | Memilih 10 fitur inti dari 27 fitur/use case. Menetapkan urutan front-end → back-end/database (Supabase) → analisis nada. |
| Artefak | Rencana tahapan dan prompt per tahap |
| Verifikasi | Progres fitur dicatat di bagian "Progres Fitur" [README.md](../README.md) |

### b. Implementasi Bertahap

Setiap baris di bawah adalah uji manual yang dilakukan pengembang setelah hasil agent lolos *quality gate*.

| Tahap | Isi |
|---|---|
| Front-end | Seluruh halaman publik, auth, pengguna, dan admin |
| Integrasi Supabase | Auth, PostgreSQL dengan RLS, Storage MIDI |
| Dokumentasi | README ditulis ulang | 
| Fitur admin | Data materi, pengguna, statistik, dan transaksi |
| Uji coba Premium | Aktivasi 7 hari dan perhitungan sisa masa aktif |
| Keamanan | Lihat bagian d |
| Analisis tempo dan lonjakan | Nyanyian lebih cepat/lambat dari acuan dan lonjakan nada sesaat; jadwal `pg_cron` |
| Font notasi | Font VexFlow disajikan dari server sendiri setelah CSP diterapkan, beserta lisensinya |

### c. Pengujian

| Aspek | Isi |
|---|---|
| Tujuan | Analisis nada, validasi, dan keamanan berperilaku sesuai harapan tanpa perlu mikrofon |
| Peran agent | Menulis tes Vitest dan menjalankannya pada setiap perubahan |
| Keputusan manusia | Menetapkan ambang penerimaan (mis. nada tepat ≥ 80, geser 1 semiton ≤ 50) dan skenario yang wajib dites |
| Artefak | [tests/](../tests/): 7 berkas, 110 tes saat dokumen ini ditulis |
| Verifikasi | `npm test` dan uji manual pengembang di browser dengan mikrofon |

Cakupan tes otomatis:

| Berkas | Cakupan |
|---|---|
| [analisis.test.ts](../tests/analisis.test.ts) | CREPE dengan audio sintetis: nada tepat ≥ 80, geser 1 semiton ≤ 50, beda oktaf, diapit nada acak, lonjakan oktaf, 1,3× lebih cepat, 0,8× lebih lambat, hening |
| [dtw-skor.test.ts](../tests/dtw-skor.test.ts) | Aturan skor, DTW, subsequence (rekaman 49 detik), tempo, jeda tanpa suara, pembersihan lonjakan, notasi, waktu analisis rekaman 30 detik |
| [validasi-midi.test.ts](../tests/validasi-midi.test.ts) | Validasi berkas MIDI unggahan admin |
| [sesi-analisis.test.ts](../tests/sesi-analisis.test.ts) | Validasi rentang data hasil analisis dan terjemahan galat database |
| [keamanan.test.ts](../tests/keamanan.test.ts) | *Open redirect*, sesi pemulihan kata sandi, alamat situs |
| [permintaan.test.ts](../tests/permintaan.test.ts) | Batas ukuran body, `Content-Type`/`Origin`, IP klien, pembatas percobaan, log galat |
| [status-paket.test.ts](../tests/status-paket.test.ts) | Sisa masa aktif paket dan hak uji coba |

Contoh temuan uji manual pengembang yang kemudian diperbaiki agent:

| Temuan | Tindak lanjut |
|---|---|
| Rekaman 49 detik salah diselaraskan | Subsequence DTW |
| Uji coba yang baru aktif tampil "Sisa 8 hari" | Perhitungan sisa waktu dengan toleransi selisih jam |
| Notasi rusak setelah CSP diterapkan | Font disajikan sendiri |

### d. Keamanan

| Aspek | Isi |
|---|---|
| Tujuan | Menutup celah sebelum aplikasi dibuka untuk publik |
| Peran agent | Claude Code mengaudit kode, konfigurasi, SQL, riwayat git, dependensi, dan Docker. Hasilnya [AUDIT-KEAMANAN.md](AUDIT-KEAMANAN.md): 15 temuan (1 Tinggi, 6 Sedang, 8 Rendah). Agent juga menyusun [supabase/audit-keamanan.sql](../supabase/audit-keamanan.sql) berisi query hanya-baca. |
| Keputusan manusia | Menyetujui perbaikan dalam 3 tahap; menerima risiko yang tersisa (skor dihitung di klien, pembatas percobaan di memori, CSP `'unsafe-inline'`); menjalankan migrasi dan query audit di database sungguhan |
| Artefak | Laporan audit; migrasi `migrasi-02` s.d. `migrasi-04`; tes keamanan |
| Verifikasi | Pengembang menjalankan `audit-keamanan.sql` dan membandingkannya dengan "Harapan" di setiap bagian. Hak akses tambahan (TRUNCATE/TRIGGER/REFERENCES dan `set_updated_at`) kemudian dicabut. Jadwal harian `pg_cron` untuk paket kedaluwarsa juga ditambahkan. |

Tahap perbaikan keamanan:

| Tahap | Temuan |
|---|---|
| Laporan | 15 temuan, tanpa perubahan kode |
| 1 | KS-01, KS-03, KS-08, KS-13: kuota dan sesi analisis atomik, validasi rentang, hak eksekusi fungsi |
| 2 | KS-02, KS-06, KS-07, KS-09, KS-10, KS-12: *open redirect*, cookie, header keamanan, alur akun |
| 3 | KS-04, KS-05, KS-11, KS-14, KS-15: batas body, pembatas percobaan, CSRF, unggah MIDI, log |


## 4. Pola Kerja (Human-in-the-Loop)

1. **Prompt bertahap.** Pekerjaan dipecah menjadi tahap kecil dengan kriteria selesai yang jelas, misalnya tes yang wajib ada atau perintah yang wajib lolos.
2. **Laporan sebelum perubahan berisiko.** Untuk audit keamanan, agent diminta membuat laporan lebih dulu tanpa mengubah kode, lalu berhenti dan menunggu persetujuan. Perbaikan baru dikerjakan setelah pengembang memilih temuan yang akan diperbaiki.
3. **Quality gate.** `npm run build`, `npm run lint`, dan `npm test` harus lolos sebelum hasil dilaporkan. Bila diminta, agent juga menjalankan `docker compose up --build`.
4. **Migrasi manual dan aman diulang.** Perubahan database dibuat sebagai berkas migrasi baru yang aman dijalankan ulang. Pengembang menjalankannya di SQL Editor, dan agent memberi tahu kapan harus menjalankannya. Selama migrasi belum dijalankan, route menampilkan pesan rapi, bukan galat 500.
5. **Rahasia tidak disentuh.** Agent tidak membuka `.env*` dan tidak menulis kunci ke kode, dokumen, maupun log.

## 5. Contoh Prompt

Prompt berikut diparafrasekan dan diringkas.

| Prompt | Hasil | Verifikasi |
|---|---|---|
| **Audit keamanan tahap 1:** "Periksa API route (sesi, IDOR, validasi, kuota), autentikasi dan pengalihan, kunci rahasia, header, database dan storage, dependensi dan Docker. Tulis laporan berisi ID, lokasi, risiko, dampak, dan usulan. Jangan ubah kode; tunggu persetujuan." | `AUDIT-KEAMANAN.md` (15 temuan) dan `supabase/audit-keamanan.sql`; tidak ada kode yang diubah | Pengembang meninjau laporan dan menjalankan query audit di database |
| **Notasi rusak setelah CSP:** "Periksa penyebabnya, sajikan font VexFlow dari server sendiri tanpa melonggarkan CSP ke CDN, pastikan font termuat sebelum notasi digambar, dan uji di browser." | Penyebabnya font tertanam sebagai *data URL* yang diblokir `font-src 'self'`. Font dipindah ke `public/fonts/vexflow/` dan dimuat dengan `Font.load()`. | Uji browser headless terhadap image Docker pada keenam materi, tanpa pelanggaran CSP. Lisensi font (SIL OFL 1.1) ditambahkan atas permintaan pengembang. |

## 6. Jejak Artefak

| Artefak | Isi |
|---|---|
| [README.md](../README.md) | Fitur, cara menjalankan (lokal dan Docker), progres fitur |
| [AGENTS.md](../AGENTS.md) | Panduan kerja AI agent di repo ini |
| [AUDIT-KEAMANAN.md](AUDIT-KEAMANAN.md) | Laporan audit keamanan dan status perbaikan |
| [supabase/schema.sql](../supabase/schema.sql), [seed.sql](../supabase/seed.sql) | Skema awal dan data contoh |
| [supabase/migrasi-01-uji-coba.sql](../supabase/migrasi-01-uji-coba.sql) s.d. [migrasi-04-bucket-midi.sql](../supabase/migrasi-04-bucket-midi.sql) | Migrasi bertahap |
| [supabase/audit-keamanan.sql](../supabase/audit-keamanan.sql) | Query hanya-baca untuk memverifikasi database |
| [tests/](../tests/) | Tes otomatis |
| [Dockerfile](../Dockerfile), [docker-compose.yml](../docker-compose.yml) | Image dan perintah Docker |

## 7. Risiko dan Batasan Penggunaan AI

| Risiko | Contoh nyata | Mitigasi |
|---|---|---|
| Halusinasi atau asumsi keliru | Rencana deploy ke Render berubah setelah dokumen revisi dibaca. Penamaan bahan uji yang mirip materi bawaan menimbulkan kebingungan. | Review manusia atas rencana dan hasil sebelum dilanjutkan |
| Usulan yang tidak cocok dengan data sebenarnya | Batas waktu 120 detik di usulan audit akan menolak hasil analisis yang sah, sehingga dinaikkan menjadi 300 detik setelah kode diperiksa | Agent memeriksa kode sebelum menerapkan usulan; perubahan dicatat di laporan |
| Perbaikan menimbulkan masalah baru | CSP dari perbaikan keamanan memblokir font notasi | Uji manual di browser setelah setiap tahap; uji browser headless untuk alur penuh |
| Agent menyentuh hal sensitif | – | Aturan di `AGENTS.md`: tanpa commit, tanpa membuka `.env*`, migrasi dijalankan manusia |

Catatan terbuka:

- Pengujian kebutuhan non-fungsional menyeluruh (kinerja di perangkat nyata, kompatibilitas browser, beban) belum dilakukan. Tes waktu analisis yang ada baru mencakup tahap penyelarasan dan skor.
- Hasil uji manual belum dicatat sebagai laporan uji tersendiri.

## 8. Pembelajaran dan Rencana Berikutnya

Pembelajaran:

- Prompt yang memuat kriteria selesai (tes wajib, perintah wajib lolos, larangan) menghasilkan pekerjaan yang lebih mudah diverifikasi.
- Pola "laporan dulu, perbaiki setelah disetujui" membuat pengembang tetap memegang prioritas dan keputusan risiko.
- Tes otomatis dengan audio sintetis menangkap regresi analisis, tetapi temuan penting (tempo cepat, lonjakan nada, notasi rusak akibat CSP) tetap datang dari uji manual.

Rencana berikutnya:

1. Deploy ke hosting publik setelah platform ditetapkan.
2. Integrasi Midtrans untuk pembelian dan aktivasi langganan.
3. Pengujian kebutuhan non-fungsional menyeluruh.
4. Revisi SRS/SDD versi 2 sesuai implementasi dan keputusan selama pengembangan.
