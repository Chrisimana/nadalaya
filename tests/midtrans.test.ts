import { describe, expect, it, vi } from "vitest";
import {
  alamatMidtrans,
  buatOrderId,
  isiPermintaanSnap,
  labelMetode,
  nominalMidtrans,
  PAKET_BERBAYAR,
  petakanStatus,
  prosesNotifikasi,
  signatureSah,
  tandaTangan,
  waktuMidtrans,
  type DependensiNotifikasi,
} from "@/lib/midtrans";
import { DAFTAR_PAKET } from "@/lib/paket";

const KUNCI = "kunci-signature-uji";
const SERVER_KEY = "SB-Mid-server-uji";

function notifikasi(ubah: Record<string, string> = {}) {
  const dasar = { order_id: "NDL-UJI-1", status_code: "200", gross_amount: "39000.00", transaction_status: "settlement", ...ubah };
  return { ...dasar, signature_key: ubah.signature_key ?? tandaTangan(dasar.order_id, dasar.status_code, dasar.gross_amount, KUNCI) };
}

function dependensi(ubah: Partial<DependensiNotifikasi> = {}) {
  const proses = vi.fn<DependensiNotifikasi["proses"]>(async ({ status }) => status);
  const dep: DependensiNotifikasi = {
    kunciSignature: KUNCI,
    cariTransaksi: vi.fn(async () => ({ nominal: 39_000 })),
    ambilStatus: vi.fn(async (orderId: string) => ({
      order_id: orderId,
      status_code: "200",
      gross_amount: "39000.00",
      transaction_status: "settlement",
      payment_type: "bank_transfer",
      va_numbers: [{ bank: "bca", va_number: "123" }],
      settlement_time: "2026-11-16 10:15:00",
    })),
    proses,
    ...ubah,
  };
  return { dep, proses };
}

describe("signature notifikasi Midtrans", () => {
  it("cocok dengan SHA512(order_id + status_code + gross_amount + Signature Secret Key)", () => {
    const n = notifikasi();
    expect(n.signature_key).toMatch(/^[0-9a-f]{128}$/);
    expect(signatureSah(n, KUNCI)).toBe(true);
    expect(signatureSah({ ...n, signature_key: n.signature_key.toUpperCase() }, KUNCI)).toBe(true);
  });

  it("menolak signature yang dibuat dengan Server Key, nilai yang diubah, atau panjang berbeda", () => {
    const n = notifikasi();
    expect(signatureSah(notifikasi({ signature_key: tandaTangan(n.order_id, "200", "39000.00", SERVER_KEY) }), KUNCI)).toBe(false);
    expect(signatureSah({ ...n, gross_amount: "1000.00" }, KUNCI)).toBe(false);
    expect(signatureSah({ ...n, signature_key: "abc" }, KUNCI)).toBe(false);
    expect(signatureSah(n, "")).toBe(false);
  });
});

describe("pemetaan status Midtrans", () => {
  it.each([
    ["settlement", undefined, "berhasil"],
    ["capture", "accept", "berhasil"],
    ["capture", "challenge", "tertunda"],
    ["capture", "deny", "gagal"],
    ["pending", undefined, "tertunda"],
    ["deny", undefined, "gagal"],
    ["cancel", undefined, "gagal"],
    ["failure", undefined, "gagal"],
    ["expire", undefined, "kedaluwarsa"],
    ["refund", undefined, null],
  ])("%s (fraud %s) → %s", (status, fraud, harapan) => {
    expect(petakanStatus(status, fraud)).toBe(harapan);
  });

  it("label metode pembayaran", () => {
    expect(labelMetode({ payment_type: "bank_transfer", va_numbers: [{ bank: "bca" }] })).toBe("Virtual Account BCA");
    expect(labelMetode({ payment_type: "bank_transfer", permata_va_number: "8562" })).toBe("Virtual Account Permata");
    expect(labelMetode({ payment_type: "echannel" })).toBe("Virtual Account Mandiri");
    expect(labelMetode({ payment_type: "qris" })).toBe("QRIS");
  });

  it("nominal dan waktu dari Midtrans", () => {
    expect(nominalMidtrans("39000.00")).toBe(39_000);
    expect(nominalMidtrans("39000")).toBe(39_000);
    expect(nominalMidtrans("39,000.00")).toBeNull();
    expect(nominalMidtrans(undefined)).toBeNull();
    expect(waktuMidtrans("2026-11-16 10:15:00")).toBe("2026-11-16T03:15:00.000Z");
    expect(waktuMidtrans("kemarin")).toBeNull();
  });
});

describe("permintaan Snap", () => {
  it("harga dan durasi dari server sama dengan daftar paket", () => {
    for (const [kode, p] of Object.entries(PAKET_BERBAYAR)) {
      expect(DAFTAR_PAKET.find((d) => d.kode === kode)?.harga).toBe(p.harga);
    }
    expect(PAKET_BERBAYAR.premium_bulanan.durasiHari).toBe(30);
    expect(PAKET_BERBAYAR.persiapan_tes.durasiHari).toBe(90);
  });

  it("hanya Virtual Account dan QRIS, dengan batas waktu 24 jam", () => {
    const isi = isiPermintaanSnap({ orderId: "NDL-1", paket: "persiapan_tes", nama: "N".repeat(40), email: "a@contoh.com" });
    expect(isi.transaction_details).toEqual({ order_id: "NDL-1", gross_amount: 99_000 });
    expect(isi.item_details).toEqual([{ id: "persiapan_tes", price: 99_000, quantity: 1, name: "Paket Persiapan Tes" }]);
    expect(isi.enabled_payments).toEqual(["bca_va", "bni_va", "bri_va", "permata_va", "cimb_va", "echannel", "other_qris"]);
    expect(isi.expiry).toEqual({ unit: "hours", duration: 24 });
    expect(isi.customer_details.first_name).toHaveLength(30);
  });

  it("order_id unik, ≤ 50 karakter, hanya huruf, angka, dan tanda hubung", () => {
    const daftar = new Set(Array.from({ length: 200 }, () => buatOrderId()));
    expect(daftar.size).toBe(200);
    for (const id of daftar) expect(id).toMatch(/^[A-Za-z0-9_-]{1,50}$/);
  });

  it("alamat sandbox dan production", () => {
    expect(alamatMidtrans(false)).toEqual({
      snap: "https://app.sandbox.midtrans.com/snap/v1/transactions",
      api: "https://api.sandbox.midtrans.com",
      snapJs: "https://app.sandbox.midtrans.com/snap/snap.js",
    });
    expect(alamatMidtrans(true).api).toBe("https://api.midtrans.com");
  });
});

describe("pemrosesan notifikasi", () => {
  it("signature tidak valid: 403 tanpa membaca atau mengubah data", async () => {
    const { dep, proses } = dependensi();
    const hasil = await prosesNotifikasi(notifikasi({ signature_key: "0".repeat(128) }), dep);
    expect(hasil.status).toBe(403);
    expect(dep.cariTransaksi).not.toHaveBeenCalled();
    expect(dep.ambilStatus).not.toHaveBeenCalled();
    expect(proses).not.toHaveBeenCalled();
  });

  it("notifikasi sah: status dari Get Status, metode, dan waktu bayar diteruskan", async () => {
    const { dep, proses } = dependensi();
    const hasil = await prosesNotifikasi(notifikasi(), dep);
    expect(hasil).toEqual({ status: 200, isi: { hasil: "berhasil" } });
    expect(proses).toHaveBeenCalledWith({
      orderId: "NDL-UJI-1",
      status: "berhasil",
      metode: "Virtual Account BCA",
      dibayar: "2026-11-16T03:15:00.000Z",
    });
  });

  it("status di notifikasi tidak dipercaya: Get Status pending → tertunda", async () => {
    const { dep, proses } = dependensi({
      ambilStatus: async (orderId) => ({ order_id: orderId, gross_amount: "39000.00", transaction_status: "pending", payment_type: "qris" }),
    });
    await prosesNotifikasi(notifikasi({ transaction_status: "settlement" }), dep);
    expect(proses).toHaveBeenCalledWith(expect.objectContaining({ status: "tertunda", metode: "QRIS", dibayar: null }));
  });

  it("nominal tidak sama dengan transaksi: 400 tanpa diproses", async () => {
    const { dep, proses } = dependensi({ cariTransaksi: async () => ({ nominal: 99_000 }) });
    expect((await prosesNotifikasi(notifikasi(), dep)).status).toBe(400);
    expect(proses).not.toHaveBeenCalled();
  });

  it("Get Status tidak dapat dihubungi: 502 agar Midtrans mengirim ulang", async () => {
    const { dep, proses } = dependensi({ ambilStatus: async () => null });
    expect((await prosesNotifikasi(notifikasi(), dep)).status).toBe(502);
    expect(proses).not.toHaveBeenCalled();
  });

  it("transaksi tidak dikenal (notifikasi uji dashboard): 200 dan diabaikan", async () => {
    const { dep, proses } = dependensi({ cariTransaksi: async () => null });
    expect(await prosesNotifikasi(notifikasi(), dep)).toEqual({ status: 200, isi: { hasil: "diabaikan" } });
    expect(proses).not.toHaveBeenCalled();
  });

  it("notifikasi ulang dibalas 200 dengan hasil dari database", async () => {
    const { dep } = dependensi({ proses: async () => "sudah_diproses" });
    expect(await prosesNotifikasi(notifikasi(), dep)).toEqual({ status: 200, isi: { hasil: "sudah_diproses" } });
  });

  it("isi tidak lengkap: 400", async () => {
    const { dep } = dependensi();
    expect((await prosesNotifikasi({ order_id: "x" }, dep)).status).toBe(400);
  });
});
