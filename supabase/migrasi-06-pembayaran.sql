-- Migrasi 06: pemrosesan pembayaran Midtrans dan kedaluwarsa pesanan.

create or replace function public.proses_pembayaran(
  p_order_id text,
  p_status public.status_transaksi,
  p_metode text,
  p_paid_at timestamptz
)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_transaksi public.transaksi%rowtype;
  v_pengguna public.users%rowtype;
  v_durasi interval;
  v_dasar timestamptz;
begin
  select * into v_transaksi from public.transaksi where order_id = p_order_id for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'transaksi_tidak_ditemukan';
  end if;

  if v_transaksi.status <> 'tertunda' then
    return 'sudah_diproses';
  end if;

  if p_status = 'tertunda' then
    update public.transaksi
       set metode = coalesce(left(p_metode, 50), metode)
     where id = v_transaksi.id;
    return 'tertunda';
  end if;

  if p_status in ('gagal', 'kedaluwarsa') then
    update public.transaksi
       set status = p_status,
           metode = coalesce(left(p_metode, 50), metode)
     where id = v_transaksi.id;
    return p_status::text;
  end if;

  -- Pembayaran berhasil: aktifkan atau perpanjang Premium.
  select * into v_pengguna from public.users where id = v_transaksi.user_id for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'pengguna_tidak_ditemukan';
  end if;

  v_durasi := case v_transaksi.paket
    when 'premium_bulanan' then interval '30 days'
    when 'persiapan_tes' then interval '90 days'
  end;

  -- Masa aktif yang masih berjalan (Premium atau Uji Coba) diperpanjang dari tanggal berakhirnya.
  v_dasar := case
    when v_pengguna.tanggal_berakhir is not null and v_pengguna.tanggal_berakhir > now()
      then v_pengguna.tanggal_berakhir
    else now()
  end;

  update public.users
     set status_paket = 'premium',
         tanggal_berakhir = v_dasar + v_durasi
   where id = v_pengguna.id;

  update public.transaksi
     set status = 'berhasil',
         metode = coalesce(left(p_metode, 50), metode),
         paid_at = coalesce(p_paid_at, now())
   where id = v_transaksi.id;

  return 'berhasil';
end;
$$;

revoke execute on function public.proses_pembayaran(text, public.status_transaksi, text, timestamptz)
  from public, anon, authenticated;
grant execute on function public.proses_pembayaran(text, public.status_transaksi, text, timestamptz)
  to service_role;

-- Pesanan yang tidak pernah dibayar (mis. pop-up ditutup sebelum memilih metode) tidak mendapat
-- notifikasi dari Midtrans. Setelah batas bayar 24 jam ditambah 1 jam, pesanan ditandai kedaluwarsa.
create extension if not exists pg_cron with schema pg_catalog;

select cron.unschedule(jobid)
  from cron.job
 where jobname = 'kedaluwarsakan-pesanan';

select cron.schedule(
  'kedaluwarsakan-pesanan',
  '30 * * * *',
  $$ update public.transaksi set status = 'kedaluwarsa'
      where status = 'tertunda' and created_at < now() - interval '25 hours'; $$
);
