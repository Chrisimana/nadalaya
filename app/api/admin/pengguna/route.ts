import { ambilSemua, bersihkanCari, wajibAdmin } from "@/lib/server/admin";
import {
  KOLOM_PENGGUNA_ADMIN,
  kePenggunaAdmin,
  type BarisPenggunaAdmin,
} from "@/lib/server/pengguna-admin";
import { rute } from "@/lib/server/respons";
import { klienAdmin } from "@/lib/supabase/admin";
import type { StatusPaket } from "@/lib/types";

const PAKET_SAH: StatusPaket[] = ["gratis", "uji_coba", "premium"];

/**
 * UC-24 Melihat Data Pengguna. Parameter opsional: cari (nama/email) dan
 * paket (status paket efektif).
 */
export const GET = rute(async (req: Request) => {
  await wajibAdmin();
  const param = new URL(req.url).searchParams;
  const cari = bersihkanCari(param.get("cari"));
  const paket = param.get("paket") as StatusPaket | null;

  const baris = await ambilSemua<BarisPenggunaAdmin>((dari, sampai) => {
    let kueri = klienAdmin().from("users").select(KOLOM_PENGGUNA_ADMIN);
    if (cari) kueri = kueri.or(`nama.ilike.%${cari}%,email.ilike.%${cari}%`);
    return kueri.order("created_at", { ascending: false }).range(dari, sampai);
  });

  let pengguna = await kePenggunaAdmin(baris);
  if (paket && PAKET_SAH.includes(paket)) pengguna = pengguna.filter((p) => p.statusPaket === paket);
  return Response.json({ pengguna });
});
