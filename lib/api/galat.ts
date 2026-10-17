export const PESAN_BELUM_TERSAMBUNG = "Belum tersambung ke server.";

/**
 * Dilempar oleh fungsi di lib/api yang back-end-nya belum dikerjakan
 * (admin, langganan, uji coba). UI menampilkannya sebagai peringatan rapi.
 */
export class BelumTersambungError extends Error {
  constructor() {
    super(PESAN_BELUM_TERSAMBUNG);
    this.name = "BelumTersambungError";
  }
}

/** Tautan atur ulang kata sandi sudah kedaluwarsa atau pernah dipakai. */
export class TautanKedaluwarsaError extends Error {
  constructor() {
    super("Tautan kedaluwarsa.");
    this.name = "TautanKedaluwarsaError";
  }
}

/** Galat yang dikembalikan API route, pesannya sudah berbahasa Indonesia. */
export class GalatApi extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly kode?: string,
  ) {
    super(message);
    this.name = "GalatApi";
  }
}

export function adalahBelumTersambung(galat: unknown) {
  return galat instanceof BelumTersambungError;
}

/** Mengubah galat apa pun menjadi pesan berbahasa Indonesia untuk pengguna. */
export function pesanGalat(galat: unknown) {
  if (galat instanceof BelumTersambungError || galat instanceof GalatApi) {
    return galat.message;
  }
  if (galat instanceof TypeError) {
    return "Tidak dapat menghubungi server. Periksa koneksi internet Anda.";
  }
  return "Terjadi kesalahan yang tidak terduga. Silakan coba lagi.";
}
