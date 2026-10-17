import { GalatApi } from "./galat";

/** Kode galat yang membuat pengguna harus masuk ulang. */
const KODE_KELUAR: Record<string, string> = {
  belum_masuk: "/masuk",
  akun_nonaktif: "/masuk?galat=nonaktif",
};

/**
 * Memanggil API route Nadalaya dan mengembalikan isi JSON-nya.
 * Respons gagal diubah menjadi GalatApi dengan pesan dari server.
 */
export async function minta<T>(
  alamat: string,
  opsi: { method?: "GET" | "POST" | "PATCH"; body?: unknown; alihkanBilaKeluar?: boolean } = {},
): Promise<T> {
  const { method = "GET", body, alihkanBilaKeluar = true } = opsi;
  const respons = await fetch(alamat, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  const isi = await respons.json().catch(() => null);
  if (respons.ok) return isi as T;

  const pesan =
    typeof isi?.pesan === "string" ? isi.pesan : "Terjadi kesalahan pada server. Silakan coba lagi.";
  const kode = typeof isi?.kode === "string" ? isi.kode : undefined;

  if (alihkanBilaKeluar && kode && KODE_KELUAR[kode] && typeof window !== "undefined") {
    window.location.assign(KODE_KELUAR[kode]);
  }
  throw new GalatApi(pesan, respons.status, kode);
}
