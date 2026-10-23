export const PESAN_BELUM_TERSAMBUNG = "Belum tersambung ke server.";

export class BelumTersambungError extends Error {
  constructor() {
    super(PESAN_BELUM_TERSAMBUNG);
    this.name = "BelumTersambungError";
  }
}

export class TautanKedaluwarsaError extends Error {
  constructor() {
    super("Tautan kedaluwarsa.");
    this.name = "TautanKedaluwarsaError";
  }
}

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

export function pesanGalat(galat: unknown) {
  if (galat instanceof BelumTersambungError || galat instanceof GalatApi) {
    return galat.message;
  }
  if (galat instanceof TypeError) {
    return "Tidak dapat menghubungi server. Periksa koneksi internet Anda.";
  }
  return "Terjadi kesalahan yang tidak terduga. Silakan coba lagi.";
}
