export const PESAN_BELUM_TERSAMBUNG = "Belum tersambung ke server.";

/**
 * Dilempar oleh fungsi di lib/api selama back-end belum tersedia.
 * UI menangkapnya dan menampilkan pesan yang rapi, bukan halaman galat.
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

export function adalahBelumTersambung(galat: unknown) {
  return galat instanceof BelumTersambungError;
}

/** Mengubah galat apa pun menjadi pesan berbahasa Indonesia untuk pengguna. */
export function pesanGalat(galat: unknown) {
  if (galat instanceof BelumTersambungError) return galat.message;
  if (galat instanceof TypeError) {
    return "Tidak dapat menghubungi server. Periksa koneksi internet Anda.";
  }
  return "Terjadi kesalahan yang tidak terduga. Silakan coba lagi.";
}
