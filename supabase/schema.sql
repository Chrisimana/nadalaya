-- Nadalaya: skema basis data. Jalankan di Supabase SQL Editor (aman dijalankan ulang).

-- Enum
do $$
begin
  if not exists (select 1 from pg_type where typname = 'peran_pengguna') then
    create type public.peran_pengguna as enum ('pengguna', 'admin');
  end if;
  if not exists (select 1 from pg_type where typname = 'status_paket') then
    create type public.status_paket as enum ('gratis', 'uji_coba', 'premium');
  end if;
  if not exists (select 1 from pg_type where typname = 'jenis_materi') then
    create type public.jenis_materi as enum ('tangga_nada', 'interval', 'melodi');
  end if;
  if not exists (select 1 from pg_type where typname = 'status_sesi') then
    create type public.status_sesi as enum ('dimulai', 'selesai', 'batal');
  end if;
  if not exists (select 1 from pg_type where typname = 'kode_paket') then
    create type public.kode_paket as enum ('premium_bulanan', 'persiapan_tes');
  end if;
  if not exists (select 1 from pg_type where typname = 'status_transaksi') then
    create type public.status_transaksi as enum ('tertunda', 'berhasil', 'gagal', 'kedaluwarsa');
  end if;
end
$$;

-- Tabel
create table if not exists public.users (
  id                     uuid primary key references auth.users (id) on delete cascade,
  nama                   varchar(100) not null check (char_length(trim(nama)) between 2 and 100),
  email                  varchar(255) not null,
  peran                  public.peran_pengguna not null default 'pengguna',
  status_paket           public.status_paket not null default 'gratis',
  tanggal_berakhir       timestamptz,
  uji_coba_digunakan     boolean not null default false,
  tanggal_mulai_uji_coba timestamptz,
  is_aktif               boolean not null default true,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create table if not exists public.materi_latihan (
  id          uuid primary key default gen_random_uuid(),
  judul       varchar(150) not null,
  jenis       public.jenis_materi not null,
  tingkat     smallint not null default 1 check (tingkat between 1 and 3),
  is_premium  boolean not null default false,
  tempo_bpm   smallint not null default 90 check (tempo_bpm between 40 and 240),
  midi_path   text not null,
  is_aktif    boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.sesi_analisis (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users (id) on delete cascade,
  materi_id   uuid not null references public.materi_latihan (id) on delete restrict,
  status      public.status_sesi not null default 'dimulai',
  created_at  timestamptz not null default now()
);

create table if not exists public.riwayat_latihan (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users (id) on delete cascade,
  materi_id     uuid not null references public.materi_latihan (id) on delete restrict,
  sesi_id       uuid not null unique references public.sesi_analisis (id) on delete cascade,
  skor          smallint not null check (skor between 0 and 100),
  kontur_pitch  jsonb not null default '{}'::jsonb,
  nada_meleset  jsonb not null default '[]'::jsonb,
  created_at    timestamptz not null default now()
);

create table if not exists public.transaksi (
  id          uuid primary key default gen_random_uuid(),
  order_id    varchar(64) not null unique,
  user_id     uuid not null references public.users (id) on delete cascade,
  paket       public.kode_paket not null,
  nominal     integer not null check (nominal >= 0),
  metode      varchar(50),
  status      public.status_transaksi not null default 'tertunda',
  created_at  timestamptz not null default now(),
  paid_at     timestamptz
);

-- Indeks
create index if not exists sesi_analisis_user_status_waktu_idx
  on public.sesi_analisis (user_id, status, created_at desc);
create index if not exists riwayat_latihan_user_waktu_idx
  on public.riwayat_latihan (user_id, created_at desc);
create index if not exists riwayat_latihan_materi_idx
  on public.riwayat_latihan (materi_id);
create index if not exists transaksi_user_waktu_idx
  on public.transaksi (user_id, created_at desc);
create index if not exists materi_latihan_aktif_idx
  on public.materi_latihan (is_aktif, jenis, tingkat);

-- Trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

drop trigger if exists materi_latihan_set_updated_at on public.materi_latihan;
create trigger materi_latihan_set_updated_at
  before update on public.materi_latihan
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_nama text := left(coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'nama'), ''),
    split_part(new.email, '@', 1)
  ), 100);
begin
  if char_length(trim(v_nama)) < 2 then
    v_nama := 'Pengguna';
  end if;

  insert into public.users (id, nama, email, peran, status_paket)
  values (
    new.id,
    v_nama,
    new.email,
    'pengguna',
    'gratis'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.users set email = new.email where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();

-- Fungsi status paket dan kuota
create or replace function public.status_paket_efektif(p_user uuid)
returns public.status_paket
language sql
stable
set search_path = ''
as $$
  select case
    when u.status_paket = 'gratis' then 'gratis'::public.status_paket
    when u.tanggal_berakhir is null or u.tanggal_berakhir <= now() then 'gratis'::public.status_paket
    else u.status_paket
  end
  from public.users u
  where u.id = p_user;
$$;

create or replace function public.awal_hari_wib()
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select date_trunc('day', now() at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta';
$$;

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
    and s.created_at >= public.awal_hari_wib();
$$;

create or replace function public.perbarui_paket_kedaluwarsa()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_jumlah integer;
begin
  update public.users
     set status_paket = 'gratis'
   where status_paket <> 'gratis'
     and (tanggal_berakhir is null or tanggal_berakhir <= now());
  get diagnostics v_jumlah = row_count;
  return v_jumlah;
end;
$$;

revoke execute on function public.perbarui_paket_kedaluwarsa() from public, anon, authenticated;

-- Opsional: jadwal harian 00.00 WIB dengan pg_cron.
-- select cron.schedule('perbarui-paket-kedaluwarsa', '0 17 * * *',
--   $$ select public.perbarui_paket_kedaluwarsa(); $$);

-- Row Level Security
alter table public.users            enable row level security;
alter table public.materi_latihan   enable row level security;
alter table public.sesi_analisis    enable row level security;
alter table public.riwayat_latihan  enable row level security;
alter table public.transaksi        enable row level security;

revoke all on public.users, public.materi_latihan, public.sesi_analisis,
              public.riwayat_latihan, public.transaksi from anon;

revoke insert, update, delete on public.users, public.materi_latihan, public.sesi_analisis,
                                 public.riwayat_latihan, public.transaksi from authenticated;
grant select on public.users, public.materi_latihan, public.sesi_analisis,
                public.riwayat_latihan, public.transaksi to authenticated;
grant update (nama) on public.users to authenticated;

drop policy if exists "Pengguna membaca profil sendiri" on public.users;
create policy "Pengguna membaca profil sendiri"
  on public.users for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Pengguna mengubah profil sendiri" on public.users;
create policy "Pengguna mengubah profil sendiri"
  on public.users for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "Pengguna membaca materi aktif" on public.materi_latihan;
create policy "Pengguna membaca materi aktif"
  on public.materi_latihan for select to authenticated
  using (is_aktif);

drop policy if exists "Pengguna membaca sesi sendiri" on public.sesi_analisis;
create policy "Pengguna membaca sesi sendiri"
  on public.sesi_analisis for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Pengguna membaca riwayat sendiri" on public.riwayat_latihan;
create policy "Pengguna membaca riwayat sendiri"
  on public.riwayat_latihan for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Pengguna membaca transaksi sendiri" on public.transaksi;
create policy "Pengguna membaca transaksi sendiri"
  on public.transaksi for select to authenticated
  using ((select auth.uid()) = user_id);

-- Storage: bucket privat "midi"
insert into storage.buckets (id, name, public, file_size_limit)
values ('midi', 'midi', false, 1048576)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit;
