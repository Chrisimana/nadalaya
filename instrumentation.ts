import { alamatSitus } from "@/lib/keamanan";

export function register() {
  // Server produksi tidak boleh berjalan tanpa NEXT_PUBLIC_SITE_URL; saat build tidak diperiksa.
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  alamatSitus();
}
