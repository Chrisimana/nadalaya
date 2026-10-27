-- Audit keamanan Nadalaya: HANYA-BACA, tidak mengubah apa pun.
-- Jalankan per bagian di Supabase SQL Editor dan bandingkan dengan "Harapan".

-- 1. Tabel dan status RLS
-- Harapan: kelima tabel rls_aktif = true.
select c.relname as tabel,
       c.relrowsecurity as rls_aktif,
       c.relforcerowsecurity as rls_dipaksa
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by c.relname;

-- 2. Semua policy di skema public dan storage
-- Harapan: public hanya berisi policy SELECT/UPDATE "sendiri" untuk authenticated
-- dan SELECT materi aktif; storage.objects TIDAK punya policy untuk bucket midi.
select schemaname as skema, tablename as tabel, policyname as policy,
       cmd as perintah, roles as peran, qual as syarat_using, with_check
from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, tablename, policyname;

-- 3. Hak akses per tabel
-- Harapan: anon tidak punya hak apa pun; authenticated hanya SELECT.
select table_name as tabel, grantee as peran,
       string_agg(privilege_type, ', ' order by privilege_type) as hak
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated', 'PUBLIC')
group by table_name, grantee
order by table_name, grantee;

-- 4. Hak akses per kolom (UPDATE/INSERT)
-- Harapan: authenticated hanya UPDATE kolom users.nama.
select table_name as tabel, column_name as kolom, grantee as peran, privilege_type as hak
from information_schema.column_privileges
where table_schema = 'public'
  and grantee in ('anon', 'authenticated', 'PUBLIC')
  and privilege_type in ('INSERT', 'UPDATE')
order by table_name, column_name, grantee;

-- 5. Fungsi di skema public: SECURITY DEFINER, search_path, dan hak eksekusi
-- Harapan: setiap fungsi punya search_path tetap; aktifkan_uji_coba dan
-- perbarui_paket_kedaluwarsa tidak dapat dieksekusi oleh anon/authenticated.
select p.proname as fungsi,
       pg_get_function_identity_arguments(p.oid) as argumen,
       p.prosecdef as security_definer,
       coalesce(array_to_string(p.proconfig, ', '), '(tidak diatur)') as konfigurasi,
       has_function_privilege('anon', p.oid, 'execute') as anon_boleh,
       has_function_privilege('authenticated', p.oid, 'execute') as authenticated_boleh,
       has_function_privilege('service_role', p.oid, 'execute') as service_role_boleh
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
order by p.prosecdef desc, p.proname;

-- 6. Fungsi SECURITY DEFINER tanpa search_path tetap
-- Harapan: tidak ada baris.
select p.proname as fungsi
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prosecdef
  and not exists (
    select 1 from unnest(coalesce(p.proconfig, '{}')) k where k like 'search_path=%'
  );

-- 7. Hak bawaan untuk objek baru di skema public
-- Catatan: Supabase biasanya memberi hak ke anon/authenticated untuk tabel dan
-- fungsi baru; migrasi berikutnya perlu mencabutnya secara eksplisit.
select pg_get_userbyid(d.defaclrole) as pemilik,
       case d.defaclobjtype when 'r' then 'tabel' when 'f' then 'fungsi'
            when 'S' then 'sequence' else d.defaclobjtype::text end as jenis,
       d.defaclacl as hak_bawaan
from pg_default_acl d
join pg_namespace n on n.oid = d.defaclnamespace
where n.nspname = 'public';

-- 8. Pengaturan bucket storage
-- Harapan: midi -> public = false, file_size_limit = 1048576.
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
order by id;

-- 9. Jumlah berkas di bucket midi (memastikan berkas ada di akar, bukan folder)
select bucket_id,
       count(*) as jumlah_berkas,
       count(*) filter (where name like '%/%') as di_dalam_folder
from storage.objects
where bucket_id = 'midi'
group by bucket_id;

-- 10. Jadwal pg_cron
-- Harapan: satu job 'perbarui-paket-kedaluwarsa', jadwal '0 17 * * *', active = true.
select jobid, jobname, schedule, command, active
from cron.job
order by jobname;

-- 11. Akun admin (memastikan hanya akun yang memang dimaksud)
select id, email, is_aktif, created_at
from public.users
where peran = 'admin'
order by created_at;
