-- Migrasi 02: kuota dan sesi analisis atomik, serta pencabutan hak eksekusi fungsi.
-- Jalankan setelah migrasi-01-uji-coba.sql (aman dijalankan ulang).
-- Batas kuota (3) dan umur sesi (15 menit) disamakan dengan lib/paket.ts dan lib/sesiAnalisis.ts.

-- Waktu selesai sesi; kuota harian dihitung dari kolom ini.
alter table public.sesi_analisis add column if not exists selesai_at timestamptz;

update public.sesi_analisis s
   set selesai_at = r.created_at
  from public.riwayat_latihan r
 where r.sesi_id = s.id
   and s.status = 'selesai'
   and s.selesai_at is null;

update public.sesi_analisis
   set selesai_at = created_at
 where status = 'selesai'
   and selesai_at is null;

create index if not exists sesi_analisis_user_selesai_idx
  on public.sesi_analisis (user_id, selesai_at desc)
  where status = 'selesai';

create or replace function public.jumlah_sesi_selesai_hari_ini(p_user uuid)
returns integer
language sql
stable
set search_path = ''
as $$
  select count(*)::integer
  from public.sesi_analisis s
  where s.user_id = p_user
    and s.status = 'selesai'
    and s.selesai_at >= public.awal_hari_wib();
$$;

-- Sesi "dimulai" yang lebih dari 15 menit ditandai batal.
create or replace function public.batalkan_sesi_kedaluwarsa(p_user uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.sesi_analisis
     set status = 'batal'
   where user_id = p_user
     and status = 'dimulai'
     and created_at < now() - interval '15 minutes';
$$;

create or replace function public.mulai_sesi(p_user uuid, p_materi uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pengguna public.users%rowtype;
  v_materi   public.materi_latihan%rowtype;
  v_paket    public.status_paket;
  v_selesai  integer;
  v_berjalan integer;
  v_id       uuid;
begin
  -- Kunci baris pengguna agar permintaan paralel diproses satu per satu.
  select * into v_pengguna from public.users where id = p_user for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'pengguna_tidak_ditemukan';
  end if;
  if not v_pengguna.is_aktif then
    raise exception using errcode = 'P0001', message = 'akun_nonaktif';
  end if;

  select * into v_materi from public.materi_latihan where id = p_materi and is_aktif;
  if not found then
    raise exception using errcode = 'P0001', message = 'materi_tidak_ditemukan';
  end if;

  v_paket := public.status_paket_efektif(p_user);
  if v_materi.is_premium and v_paket = 'gratis' then
    raise exception using errcode = 'P0001', message = 'materi_premium';
  end if;

  perform public.batalkan_sesi_kedaluwarsa(p_user);

  if v_paket = 'gratis' then
    select count(*) filter (where status = 'selesai' and selesai_at >= public.awal_hari_wib()),
           count(*) filter (where status = 'dimulai')
      into v_selesai, v_berjalan
      from public.sesi_analisis
     where user_id = p_user;

    if v_selesai >= 3 then
      raise exception using errcode = 'P0001', message = 'kuota_habis';
    end if;
    if v_selesai + v_berjalan >= 3 then
      raise exception using errcode = 'P0001', message = 'sesi_berjalan';
    end if;
  end if;

  insert into public.sesi_analisis (user_id, materi_id, status)
  values (p_user, p_materi, 'dimulai')
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.selesaikan_sesi(
  p_user uuid,
  p_sesi uuid,
  p_skor integer,
  p_kontur jsonb,
  p_nada jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pengguna public.users%rowtype;
  v_sesi     public.sesi_analisis%rowtype;
  v_paket    public.status_paket;
  v_selesai  integer;
  v_riwayat  uuid;
begin
  select * into v_pengguna from public.users where id = p_user for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'pengguna_tidak_ditemukan';
  end if;
  if not v_pengguna.is_aktif then
    raise exception using errcode = 'P0001', message = 'akun_nonaktif';
  end if;

  select * into v_sesi from public.sesi_analisis
   where id = p_sesi and user_id = p_user
   for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'sesi_tidak_ditemukan';
  end if;
  if v_sesi.status <> 'dimulai' then
    raise exception using errcode = 'P0001', message = 'sesi_tidak_aktif';
  end if;
  -- Sesi kedaluwarsa ditandai batal oleh mulai_sesi berikutnya.
  if v_sesi.created_at < now() - interval '15 minutes' then
    raise exception using errcode = 'P0001', message = 'sesi_kedaluwarsa';
  end if;

  v_paket := public.status_paket_efektif(p_user);
  if v_paket = 'gratis' then
    if exists (
      select 1 from public.materi_latihan where id = v_sesi.materi_id and is_premium
    ) then
      raise exception using errcode = 'P0001', message = 'materi_premium';
    end if;

    select count(*) into v_selesai
      from public.sesi_analisis
     where user_id = p_user
       and status = 'selesai'
       and selesai_at >= public.awal_hari_wib();
    if v_selesai >= 3 then
      raise exception using errcode = 'P0001', message = 'kuota_habis';
    end if;
  end if;

  insert into public.riwayat_latihan (user_id, materi_id, sesi_id, skor, kontur_pitch, nada_meleset)
  values (p_user, v_sesi.materi_id, p_sesi, p_skor, p_kontur, p_nada)
  returning id into v_riwayat;

  update public.sesi_analisis
     set status = 'selesai',
         selesai_at = now()
   where id = p_sesi
     and status = 'dimulai';

  return v_riwayat;
end;
$$;

-- Mengembalikan true bila sesi dibatalkan, false bila sesi sudah tidak "dimulai".
create or replace function public.batalkan_sesi(p_user uuid, p_sesi uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.status_sesi;
begin
  select status into v_status from public.sesi_analisis
   where id = p_sesi and user_id = p_user
   for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'sesi_tidak_ditemukan';
  end if;
  if v_status <> 'dimulai' then
    return false;
  end if;

  update public.sesi_analisis set status = 'batal' where id = p_sesi;
  return true;
end;
$$;

-- Hak eksekusi: fungsi hanya dapat dipanggil server (service_role).
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_user_email_change() from public, anon, authenticated;
revoke execute on function public.status_paket_efektif(uuid) from public, anon, authenticated;
revoke execute on function public.jumlah_sesi_selesai_hari_ini(uuid) from public, anon, authenticated;
revoke execute on function public.awal_hari_wib() from public, anon, authenticated;
revoke execute on function public.batalkan_sesi_kedaluwarsa(uuid) from public, anon, authenticated;
revoke execute on function public.mulai_sesi(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.selesaikan_sesi(uuid, uuid, integer, jsonb, jsonb) from public, anon, authenticated;
revoke execute on function public.batalkan_sesi(uuid, uuid) from public, anon, authenticated;

grant execute on function public.status_paket_efektif(uuid) to service_role;
grant execute on function public.jumlah_sesi_selesai_hari_ini(uuid) to service_role;
grant execute on function public.awal_hari_wib() to service_role;
grant execute on function public.mulai_sesi(uuid, uuid) to service_role;
grant execute on function public.selesaikan_sesi(uuid, uuid, integer, jsonb, jsonb) to service_role;
grant execute on function public.batalkan_sesi(uuid, uuid) to service_role;

-- Muat ulang cache skema PostgREST agar fungsi baru langsung dikenali.
notify pgrst, 'reload schema';
