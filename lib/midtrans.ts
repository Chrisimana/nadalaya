import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { KodePaketBerbayar, StatusTransaksi } from "@/lib/types";

/** Harga dan durasi ditetapkan server; samakan durasi dengan supabase/migrasi-06-pembayaran.sql. */
export const PAKET_BERBAYAR: Record<KodePaketBerbayar, { nama: string; harga: number; durasiHari: number }> = {
  premium_bulanan: { nama: "Premium Bulanan", harga: 39_000, durasiHari: 30 },
  persiapan_tes: { nama: "Paket Persiapan Tes", harga: 99_000, durasiHari: 90 },
};

export function kodePaketSah(nilai: unknown): nilai is KodePaketBerbayar {
  return typeof nilai === "string" && Object.hasOwn(PAKET_BERBAYAR, nilai);
}

/** Batas waktu pembayaran; samakan dengan jadwal kedaluwarsa di migrasi-06. */
export const BATAS_BAYAR_JAM = 24;

/** Virtual Account dan QRIS saja. */
export const METODE_DIIZINKAN = ["bca_va", "bni_va", "bri_va", "permata_va", "cimb_va", "echannel", "other_qris"];

export function alamatMidtrans(produksi: boolean) {
  return produksi
    ? { snap: "https://app.midtrans.com/snap/v1/transactions", api: "https://api.midtrans.com", snapJs: "https://app.midtrans.com/snap/snap.js" }
    : {
        snap: "https://app.sandbox.midtrans.com/snap/v1/transactions",
        api: "https://api.sandbox.midtrans.com",
        snapJs: "https://app.sandbox.midtrans.com/snap/snap.js",
      };
}

export function modeProduksiMidtrans(nilai = process.env.MIDTRANS_IS_PRODUCTION) {
  return nilai === "true";
}

/** Maksimal 50 karakter; hanya huruf, angka, dan tanda hubung. */
export function buatOrderId(sekarang = Date.now()) {
  return `NDL-${sekarang.toString(36).toUpperCase()}-${randomBytes(6).toString("hex").toUpperCase()}`;
}

export function authBasic(serverKey: string) {
  return `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`;
}

export function isiPermintaanSnap(opsi: {
  orderId: string;
  paket: KodePaketBerbayar;
  nama: string;
  email: string;
}) {
  const p = PAKET_BERBAYAR[opsi.paket];
  return {
    transaction_details: { order_id: opsi.orderId, gross_amount: p.harga },
    item_details: [{ id: opsi.paket, price: p.harga, quantity: 1, name: p.nama }],
    // Nama dibatasi 30 karakter untuk Virtual Account.
    customer_details: { first_name: opsi.nama.slice(0, 30), email: opsi.email },
    enabled_payments: METODE_DIIZINKAN,
    expiry: { unit: "hours", duration: BATAS_BAYAR_JAM },
  };
}

export function tandaTangan(orderId: string, statusCode: string, grossAmount: string, kunci: string) {
  return createHash("sha512").update(orderId + statusCode + grossAmount + kunci).digest("hex");
}

/** signature_key = SHA512(order_id + status_code + gross_amount + Signature Secret Key), dibandingkan waktu-konstan. */
export function signatureSah(
  isi: { order_id: string; status_code: string; gross_amount: string; signature_key: string },
  kunci: string,
) {
  if (!kunci) return false;
  const harapan = Buffer.from(tandaTangan(isi.order_id, isi.status_code, isi.gross_amount, kunci), "utf8");
  const diterima = Buffer.from(isi.signature_key.toLowerCase(), "utf8");
  return harapan.length === diterima.length && timingSafeEqual(harapan, diterima);
}

/** "39000.00" → 39000; null bila bukan angka rupiah yang sah. */
export function nominalMidtrans(nilai: unknown): number | null {
  if (typeof nilai !== "string" && typeof nilai !== "number") return null;
  const teks = String(nilai);
  if (!/^\d+(\.\d{1,2})?$/.test(teks)) return null;
  return Number(teks);
}

/** null berarti status tidak memengaruhi transaksi (mis. refund) dan diabaikan. */
export function petakanStatus(transaksi: unknown, fraud?: unknown): StatusTransaksi | null {
  switch (transaksi) {
    case "settlement":
      return "berhasil";
    case "capture":
      return fraud === "accept" ? "berhasil" : fraud === "deny" ? "gagal" : "tertunda";
    case "pending":
      return "tertunda";
    case "deny":
    case "cancel":
    case "failure":
      return "gagal";
    case "expire":
      return "kedaluwarsa";
    default:
      return null;
  }
}

const NAMA_BANK: Record<string, string> = { bca: "BCA", bni: "BNI", bri: "BRI", cimb: "CIMB Niaga", permata: "Permata" };

type DataStatus = {
  payment_type?: unknown;
  va_numbers?: { bank?: unknown }[];
  permata_va_number?: unknown;
  issuer?: unknown;
};

export function labelMetode(d: DataStatus): string | null {
  switch (d.payment_type) {
    case "bank_transfer": {
      const bank = typeof d.va_numbers?.[0]?.bank === "string" ? d.va_numbers[0].bank : d.permata_va_number ? "permata" : "";
      return `Virtual Account ${NAMA_BANK[bank] ?? bank.toUpperCase()}`.trim();
    }
    case "echannel":
      return "Virtual Account Mandiri";
    case "qris":
      return "QRIS";
    case "gopay":
      return "GoPay";
    default:
      return typeof d.payment_type === "string" ? d.payment_type.slice(0, 50) : null;
  }
}

/** settlement_time Midtrans berupa "YYYY-MM-DD HH:MM:SS" dalam WIB. */
export function waktuMidtrans(nilai: unknown): string | null {
  if (typeof nilai !== "string" || !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(nilai)) return null;
  const t = new Date(`${nilai.replace(" ", "T")}+07:00`);
  return Number.isNaN(t.getTime()) ? null : t.toISOString();
}

export type Notifikasi = { order_id: string; status_code: string; gross_amount: string; signature_key: string };

export function bacaNotifikasi(isi: Record<string, unknown>): Notifikasi | null {
  const { order_id, status_code, gross_amount, signature_key } = isi;
  if ([order_id, status_code, gross_amount, signature_key].some((v) => typeof v !== "string" || !v)) return null;
  if ((order_id as string).length > 64) return null;
  return isi as Notifikasi;
}

export type HasilProses = { status: number; isi: Record<string, unknown> };

export type DependensiNotifikasi = {
  kunciSignature: string;
  cariTransaksi: (orderId: string) => Promise<{ nominal: number } | null>;
  /** Get Status API; null bila Midtrans tidak dapat dihubungi. */
  ambilStatus: (orderId: string) => Promise<Record<string, unknown> | null>;
  proses: (masukan: { orderId: string; status: StatusTransaksi; metode: string | null; dibayar: string | null }) => Promise<string>;
};

/**
 * Memproses notifikasi HTTP Midtrans. Status diambil dari Get Status API, bukan dari isi notifikasi,
 * lalu diterapkan atomik oleh proses_pembayaran yang idempoten.
 */
export async function prosesNotifikasi(isi: Record<string, unknown>, dep: DependensiNotifikasi): Promise<HasilProses> {
  const n = bacaNotifikasi(isi);
  if (!n) return { status: 400, isi: { pesan: "Notifikasi tidak valid." } };
  if (!signatureSah(n, dep.kunciSignature)) return { status: 403, isi: { pesan: "Tanda tangan notifikasi tidak valid." } };

  const transaksi = await dep.cariTransaksi(n.order_id);
  // Notifikasi uji dari dashboard Midtrans memakai order_id acak; dibalas 200 agar tidak dikirim ulang.
  if (!transaksi) return { status: 200, isi: { hasil: "diabaikan" } };
  if (nominalMidtrans(n.gross_amount) !== transaksi.nominal) {
    return { status: 400, isi: { pesan: "Nominal tidak sesuai dengan transaksi." } };
  }

  const resmi = await dep.ambilStatus(n.order_id);
  if (!resmi) return { status: 502, isi: { pesan: "Status pembayaran belum dapat dikonfirmasi." } };
  if (resmi.order_id !== n.order_id || nominalMidtrans(resmi.gross_amount) !== transaksi.nominal) {
    return { status: 400, isi: { pesan: "Status Midtrans tidak sesuai dengan transaksi." } };
  }

  const status = petakanStatus(resmi.transaction_status, resmi.fraud_status);
  if (!status) return { status: 200, isi: { hasil: "diabaikan" } };

  const hasil = await dep.proses({
    orderId: n.order_id,
    status,
    metode: labelMetode(resmi as DataStatus),
    dibayar: status === "berhasil" ? (waktuMidtrans(resmi.settlement_time ?? isi.settlement_time) ?? new Date().toISOString()) : null,
  });
  return { status: 200, isi: { hasil } };
}
