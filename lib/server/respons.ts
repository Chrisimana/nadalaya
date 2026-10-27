import "server-only";

import { unstable_rethrow } from "next/navigation";
import { GalatRute } from "@/lib/galatRute";
import { alamatSitus } from "@/lib/keamanan";
import { BATAS_JSON, bacaTeksTerbatas, ringkasGalat, wajibAsalSama, wajibJson } from "@/lib/permintaan";

export { GalatRute };

export function jsonGalat(status: number, pesan: string, kode?: string, header?: Record<string, string>) {
  return Response.json({ pesan, ...(kode ? { kode } : {}) }, { status, headers: header });
}

export function rute<A extends unknown[]>(handler: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      if (args[0] instanceof Request) wajibAsalSama(args[0], alamatSitus);
      return await handler(...args);
    } catch (err) {
      // Galat internal Next.js (mis. saat prerender) harus diteruskan.
      unstable_rethrow(err);
      if (err instanceof GalatRute) return jsonGalat(err.status, err.message, err.kode, err.header);
      console.error("[api]", ringkasGalat(err));
      return jsonGalat(500, "Terjadi kesalahan pada server. Silakan coba lagi.", "galat_server");
    }
  };
}

export async function bacaJson(req: Request, batas = BATAS_JSON): Promise<Record<string, unknown>> {
  wajibJson(req);
  const teksBody = await bacaTeksTerbatas(req, batas);
  try {
    const isi = JSON.parse(teksBody);
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
