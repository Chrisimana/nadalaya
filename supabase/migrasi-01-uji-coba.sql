-- Migrasi 01: aktivasi uji coba Premium 7 hari. Jalankan setelah schema.sql (aman dijalankan ulang).

create or replace function public.aktifkan_uji_coba(p_user uuid)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pengguna public.users%rowtype;
  v_berakhir timestamptz;
begin
  -- Kunci baris agar dua permintaan bersamaan tidak sama-sama lolos.
  select * into v_pengguna from public.users where id = p_user for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'pengguna_tidak_ditemukan';
  end if;
  if not v_pengguna.is_aktif then
    raise exception using errcode = 'P0001', message = 'akun_nonaktif';
  end if;
  if v_pengguna.uji_coba_digunakan then
    raise exception using errcode = 'P0001', message = 'uji_coba_digunakan';
  end if;
  if public.status_paket_efektif(p_user) <> 'gratis' then
    raise exception using errcode = 'P0001', message = 'sudah_premium';
  end if;

  v_berakhir := now() + interval '7 days';
  update public.users
     set status_paket = 'uji_coba',
         tanggal_mulai_uji_coba = now(),
         tanggal_berakhir = v_berakhir,
         uji_coba_digunakan = true
   where id = p_user;

  return v_berakhir;
end;
$$;

revoke execute on function public.aktifkan_uji_coba(uuid) from public, anon, authenticated;
grant execute on function public.aktifkan_uji_coba(uuid) to service_role;
