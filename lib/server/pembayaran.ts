import "server-only";

import { alamatMidtrans, authBasic, modeProduksiMidtrans } from "@/lib/midtrans";
import { ringkasGalat } from "@/lib/permintaan";

const BATAS_WAKTU_MS = 10_000;

function serverKey() {
  const kunci = process.env.MIDTRANS_SERVER_KEY;
  if (!kunci) throw new Error("MIDTRANS_SERVER_KEY belum diisi.");
  return kunci;
}

export function kunciSignature() {
  return process.env.MIDTRANS_SIGNATURE_SECRET_KEY ?? "";
}

/** Meminta token Snap; null bila Midtrans menolak atau tidak dapat dihubungi. */
export async function mintaTokenSnap(isi: unknown): Promise<string | null> {
  try {
    const respons = await fetch(alamatMidtrans(modeProduksiMidtrans()).snap, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: authBasic(serverKey()) },
      body: JSON.stringify(isi),
      signal: AbortSignal.timeout(BATAS_WAKTU_MS),
    });
    const data = (await respons.json().catch(() => null)) as { token?: unknown; error_messages?: unknown } | null;
    if (respons.ok && typeof data?.token === "string") return data.token;
    console.error("[pembayaran] Snap API menolak", respons.status, JSON.stringify(data?.error_messages ?? null).slice(0, 300));
  } catch (err) {
    console.error("[pembayaran] Snap API tidak dapat dihubungi", ringkasGalat(err));
  }
  return null;
}

/** Get Status API Midtrans; null bila gagal dihubungi atau transaksi tidak dikenal. */
export async function ambilStatusMidtrans(orderId: string): Promise<Record<string, unknown> | null> {
  try {
    const alamat = `${alamatMidtrans(modeProduksiMidtrans()).api}/v2/${encodeURIComponent(orderId)}/status`;
    const respons = await fetch(alamat, {
      headers: { Accept: "application/json", Authorization: authBasic(serverKey()) },
      signal: AbortSignal.timeout(BATAS_WAKTU_MS),
    });
    const data = (await respons.json().catch(() => null)) as Record<string, unknown> | null;
    if (respons.ok && data && /^2\d\d$/.test(String(data.status_code))) return data;
    console.error("[pembayaran] Get Status menolak", respons.status, String(data?.status_code ?? ""), String(data?.status_message ?? "").slice(0, 200));
  } catch (err) {
    console.error("[pembayaran] Get Status tidak dapat dihubungi", ringkasGalat(err));
  }
  return null;
}
