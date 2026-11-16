import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

// Menjalankan proses_pembayaran yang asli (migrasi-06) di PostgreSQL WebAssembly, tanpa jaringan.
const skema = readFileSync("supabase/schema.sql", "utf8");
const migrasi = readFileSync("supabase/migrasi-06-pembayaran.sql", "utf8");

function potong(teks: string, awal: string, akhir: string) {
  const a = teks.indexOf(awal);
  const b = teks.indexOf(akhir, a);
  if (a < 0 || b < 0) throw new Error(`bagian tidak ditemukan: ${awal}`);
  return teks.slice(a, b + akhir.length);
}

const HARI = 24 * 60 * 60 * 1000;
let db: PGlite;

async function satu<T>(sql: string, param: unknown[] = []) {
  return (await db.query<T>(sql, param)).rows[0];
}

async function buatPengguna(paket: "gratis" | "uji_coba" | "premium", sisaHari: number | null) {
  const { id } = await satu<{ id: string }>("insert into auth.users default values returning id");
  await db.query(
    `insert into public.users (id, nama, email, status_paket, tanggal_berakhir)
     values ($1, 'Pengguna Uji', 'uji@contoh.com', $2, $3)`,
    [id, paket, sisaHari === null ? null : new Date(Date.now() + sisaHari * HARI).toISOString()],
  );
  return id;
}

async function buatTransaksi(userId: string, paket: "premium_bulanan" | "persiapan_tes", orderId: string) {
  await db.query(
    "insert into public.transaksi (order_id, user_id, paket, nominal) values ($1, $2, $3, $4)",
    [orderId, userId, paket, paket === "premium_bulanan" ? 39_000 : 99_000],
  );
}

const proses = async (orderId: string, status: string, metode: string | null = "Virtual Account BCA") =>
  (await satu<{ h: string }>("select public.proses_pembayaran($1, $2::public.status_transaksi, $3, now()) as h", [orderId, status, metode])).h;

const pengguna = (id: string) =>
  satu<{ status_paket: string; tanggal_berakhir: Date | null }>("select status_paket, tanggal_berakhir from public.users where id = $1", [id]);
const transaksi = (orderId: string) =>
  satu<{ status: string; metode: string | null; paid_at: Date | null }>("select status, metode, paid_at from public.transaksi where order_id = $1", [orderId]);

function selisihHari(dari: number, sampai: Date | null) {
  return ((sampai?.getTime() ?? 0) - dari) / HARI;
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role;
    create schema auth;
    create table auth.users (id uuid primary key default gen_random_uuid());
  `);
  await db.exec(potong(skema, "do $$", "\n$$;"));
  await db.exec(potong(skema, "create table if not exists public.users", "\n);"));
  await db.exec(potong(skema, "create table if not exists public.transaksi", "\n);"));
  const tanpaCron = migrasi.slice(0, migrasi.indexOf("create extension if not exists pg_cron"));
  await db.exec(tanpaCron);
  await db.exec(tanpaCron); // aman dijalankan ulang
}, 60_000);

beforeEach(async () => {
  await db.exec("delete from public.transaksi; delete from public.users; delete from auth.users;");
});

describe("proses_pembayaran (migrasi-06)", () => {
  it("pengguna Gratis: Premium aktif 30 hari dari sekarang", async () => {
    const id = await buatPengguna("gratis", null);
    await buatTransaksi(id, "premium_bulanan", "NDL-A");
    expect(await proses("NDL-A", "berhasil")).toBe("berhasil");

    const p = await pengguna(id);
    expect(p.status_paket).toBe("premium");
    expect(selisihHari(Date.now(), p.tanggal_berakhir)).toBeCloseTo(30, 2);
    const t = await transaksi("NDL-A");
    expect(t.status).toBe("berhasil");
    expect(t.metode).toBe("Virtual Account BCA");
    expect(t.paid_at).not.toBeNull();
  });

  it("Premium masih aktif: durasi ditambahkan dari tanggal berakhir", async () => {
    const id = await buatPengguna("premium", 10);
    const lama = (await pengguna(id)).tanggal_berakhir!.getTime();
    await buatTransaksi(id, "persiapan_tes", "NDL-B");
    await proses("NDL-B", "berhasil");
    expect(selisihHari(lama, (await pengguna(id)).tanggal_berakhir)).toBeCloseTo(90, 5);
  });

  it("Uji Coba masih berjalan: sisa hari uji coba tetap dihitung (SDD 3.2.6)", async () => {
    const id = await buatPengguna("uji_coba", 5);
    const lama = (await pengguna(id)).tanggal_berakhir!.getTime();
    await buatTransaksi(id, "premium_bulanan", "NDL-C");
    await proses("NDL-C", "berhasil");
    const p = await pengguna(id);
    expect(p.status_paket).toBe("premium");
    expect(selisihHari(lama, p.tanggal_berakhir)).toBeCloseTo(30, 5);
  });

  it("Premium yang sudah lewat masa aktifnya: dihitung dari sekarang", async () => {
    const id = await buatPengguna("premium", -3);
    await buatTransaksi(id, "premium_bulanan", "NDL-D");
    await proses("NDL-D", "berhasil");
    expect(selisihHari(Date.now(), (await pengguna(id)).tanggal_berakhir)).toBeCloseTo(30, 2);
  });

  it("idempoten: notifikasi ganda tidak memperpanjang dua kali", async () => {
    const id = await buatPengguna("gratis", null);
    await buatTransaksi(id, "premium_bulanan", "NDL-E");
    expect(await proses("NDL-E", "berhasil")).toBe("berhasil");
    const setelahPertama = (await pengguna(id)).tanggal_berakhir!.getTime();
    expect(await proses("NDL-E", "berhasil")).toBe("sudah_diproses");
    expect(await proses("NDL-E", "kedaluwarsa")).toBe("sudah_diproses");
    expect((await pengguna(id)).tanggal_berakhir!.getTime()).toBe(setelahPertama);
    expect((await transaksi("NDL-E")).status).toBe("berhasil");
  });

  it("pending lalu settlement: tertunda tetap dapat diproses", async () => {
    const id = await buatPengguna("gratis", null);
    await buatTransaksi(id, "premium_bulanan", "NDL-F");
    expect(await proses("NDL-F", "tertunda", "QRIS")).toBe("tertunda");
    expect(await transaksi("NDL-F")).toMatchObject({ status: "tertunda", metode: "QRIS", paid_at: null });
    expect(await proses("NDL-F", "berhasil", "QRIS")).toBe("berhasil");
    expect((await pengguna(id)).status_paket).toBe("premium");
  });

  it("gagal atau kedaluwarsa: paket pengguna tidak berubah dan tidak dapat diproses lagi", async () => {
    const id = await buatPengguna("gratis", null);
    await buatTransaksi(id, "premium_bulanan", "NDL-G");
    expect(await proses("NDL-G", "kedaluwarsa", null)).toBe("kedaluwarsa");
    expect(await proses("NDL-G", "berhasil")).toBe("sudah_diproses");
    expect(await pengguna(id)).toMatchObject({ status_paket: "gratis", tanggal_berakhir: null });
    expect((await transaksi("NDL-G")).status).toBe("kedaluwarsa");
  });

  it("transaksi tidak dikenal ditolak", async () => {
    await expect(proses("NDL-TIDAK-ADA", "berhasil")).rejects.toThrow(/transaksi_tidak_ditemukan/);
  });

  it("hanya service_role yang boleh mengeksekusi", async () => {
    const hak = await db.query<{ rolname: string; boleh: boolean }>(
      `select r.rolname, has_function_privilege(r.rolname,
         'public.proses_pembayaran(text, public.status_transaksi, text, timestamptz)', 'execute') as boleh
         from pg_roles r where r.rolname in ('anon', 'authenticated', 'service_role') order by 1`,
    );
    expect(hak.rows).toEqual([
      { rolname: "anon", boleh: false },
      { rolname: "authenticated", boleh: false },
      { rolname: "service_role", boleh: true },
    ]);
    const cfg = await satu<{ proconfig: string[] }>("select proconfig from pg_proc where proname = 'proses_pembayaran'");
    expect(cfg.proconfig).toEqual(['search_path=""']);
  });
});
