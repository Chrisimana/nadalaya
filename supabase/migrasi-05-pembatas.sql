-- Migrasi 05: pembatas percobaan bersama untuk server yang berjalan di banyak instance (Netlify).
-- Jalankan setelah migrasi-04-bucket-midi.sql (aman dijalankan ulang).

-- Kunci disimpan sebagai hash SHA-256 dari nama aturan dan IP/email, bukan teks aslinya.
create table if not exists public.percobaan_pembatas (
  id bigint generated always as identity primary key,
  kunci text not null,
  waktu timestamptz not null default now()
);

create index if not exists percobaan_pembatas_kunci_waktu_idx
  on public.percobaan_pembatas (kunci, waktu);
create index if not exists percobaan_pembatas_waktu_idx
  on public.percobaan_pembatas (waktu);

-- RLS aktif tanpa policy: anon dan authenticated tidak bisa membaca atau menulis.
alter table public.percobaan_pembatas enable row level security;
revoke all on public.percobaan_pembatas from public, anon, authenticated;
grant select, insert, delete on public.percobaan_pembatas to service_role;

-- Memeriksa beberapa aturan sekaligus secara atomik.
-- Mengembalikan detik yang harus ditunggu (0 = diizinkan dan semua kunci dicatat).
-- Bila satu aturan penuh, tidak ada kunci yang dicatat, sama seperti pembatas memori.
create or replace function public.catat_percobaan(
  p_kunci text[],
  p_batas integer[],
  p_jendela_detik integer[]
)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_jumlah_aturan integer := coalesce(array_length(p_kunci, 1), 0);
  v_kunci text;
  v_sekarang timestamptz;
  v_jumlah integer;
  v_kedaluwarsa timestamptz;
  v_tunggu integer := 0;
begin
  if v_jumlah_aturan = 0 then
    return 0;
  end if;
  if coalesce(array_length(p_batas, 1), 0) <> v_jumlah_aturan
     or coalesce(array_length(p_jendela_detik, 1), 0) <> v_jumlah_aturan then
    raise exception 'argumen_tidak_sepadan';
  end if;

  -- Kunci dikunci berurutan agar permintaan bersamaan tidak saling mengunci (deadlock).
  for v_kunci in select distinct k from unnest(p_kunci) as k order by k loop
    perform pg_advisory_xact_lock(hashtextextended(v_kunci, 0));
  end loop;

  v_sekarang := clock_timestamp();

  for i in 1 .. v_jumlah_aturan loop
    if p_batas[i] is null or p_batas[i] < 1
       or p_jendela_detik[i] is null or p_jendela_detik[i] not between 1 and 86400 then
      raise exception 'aturan_tidak_valid';
    end if;

    select count(*) into v_jumlah
      from public.percobaan_pembatas
     where kunci = p_kunci[i]
       and waktu > v_sekarang - make_interval(secs => p_jendela_detik[i]);

    if v_jumlah >= p_batas[i] then
      -- Waktu tunggu: sampai cukup banyak percobaan lama keluar dari jendela.
      select waktu + make_interval(secs => p_jendela_detik[i]) into v_kedaluwarsa
        from public.percobaan_pembatas
       where kunci = p_kunci[i]
         and waktu > v_sekarang - make_interval(secs => p_jendela_detik[i])
       order by waktu
       offset v_jumlah - p_batas[i]
       limit 1;
      v_tunggu := greatest(v_tunggu, 1, ceil(extract(epoch from v_kedaluwarsa - v_sekarang))::integer);
    end if;
  end loop;

  if v_tunggu > 0 then
    return v_tunggu;
  end if;

  insert into public.percobaan_pembatas (kunci, waktu)
  select k, v_sekarang from unnest(p_kunci) as k;
  return 0;
end;
$$;

revoke execute on function public.catat_percobaan(text[], integer[], integer[]) from public, anon, authenticated;
grant execute on function public.catat_percobaan(text[], integer[], integer[]) to service_role;

-- Jadwal per jam: hapus catatan yang lebih tua dari jendela terpanjang (24 jam).
create extension if not exists pg_cron with schema pg_catalog;

select cron.unschedule(jobid)
  from cron.job
 where jobname = 'bersihkan-percobaan-pembatas';

select cron.schedule(
  'bersihkan-percobaan-pembatas',
  '15 * * * *',
  $$ delete from public.percobaan_pembatas where waktu < now() - interval '1 day'; $$
);
