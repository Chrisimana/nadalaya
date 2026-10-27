-- Migrasi 03: pencabutan hak tabel yang tidak dibutuhkan dan jadwal harian paket kedaluwarsa.
-- Jalankan setelah migrasi-02-keamanan-sesi.sql (aman dijalankan ulang).

-- Hak tabel yang tidak dibutuhkan pengguna.
revoke truncate, trigger, references on public.users, public.materi_latihan,
  public.sesi_analisis, public.riwayat_latihan, public.transaksi from authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- Jadwal harian 00.00 WIB (17.00 UTC): paket yang sudah lewat masa berlakunya kembali ke Gratis.
create extension if not exists pg_cron with schema pg_catalog;

select cron.unschedule(jobid)
  from cron.job
 where jobname = 'perbarui-paket-kedaluwarsa';

select cron.schedule(
  'perbarui-paket-kedaluwarsa',
  '0 17 * * *',
  $$ select public.perbarui_paket_kedaluwarsa(); $$
);
