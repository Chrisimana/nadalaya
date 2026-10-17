import "server-only";

import { unstable_rethrow } from "next/navigation";

/** Galat yang sengaja dilempar di dalam route, diteruskan apa adanya ke klien. */
export class GalatRute extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly kode?: string,
  ) {
    super(message);
    this.name = "GalatRute";
  }
}

export function jsonGalat(status: number, pesan: string, kode?: string) {
  return Response.json({ pesan, ...(kode ? { kode } : {}) }, { status });
}

/**
 * Membungkus handler agar galat yang tidak terduga tidak membocorkan detail
 * server dan tetap menghasilkan pesan berbahasa Indonesia.
 */
export function rute<A extends unknown[]>(handler: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (err) {
      // Galat internal Next.js (mis. saat prerender) harus diteruskan.
      unstable_rethrow(err);
      if (err instanceof GalatRute) return jsonGalat(err.status, err.message, err.kode);
      console.error("[api]", err);
      return jsonGalat(500, "Terjadi kesalahan pada server. Silakan coba lagi.", "galat_server");
    }
  };
}

/** Membaca body JSON; body yang rusak dianggap permintaan tidak valid. */
export async function bacaJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const isi = await req.json();
    if (isi && typeof isi === "object" && !Array.isArray(isi)) return isi as Record<string, unknown>;
  } catch {
    // jatuh ke galat di bawah
  }
  throw new GalatRute(400, "Permintaan tidak valid.", "permintaan_tidak_valid");
}

export function teks(nilai: unknown) {
  return typeof nilai === "string" ? nilai : "";
}

const POLA_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function wajibUuid(nilai: unknown, nama = "ID"): string {
  if (typeof nilai !== "string" || !POLA_UUID.test(nilai)) {
    throw new GalatRute(400, `${nama} tidak valid.`, "permintaan_tidak_valid");
  }
  return nilai;
}

/** Alamat situs untuk tautan email (verifikasi dan atur ulang kata sandi). */
export function alamatSitus(req: Request) {
  return (process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin).replace(/\/$/, "");
}
