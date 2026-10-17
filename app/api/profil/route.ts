import { kePengguna, wajibLogin } from "@/lib/server/pengguna";
import { bacaJson, GalatRute, rute, teks } from "@/lib/server/respons";
import { validasiNama } from "@/lib/validasi";

/** Profil pengguna yang sedang masuk. */
export const GET = rute(async () => {
  const { profil } = await wajibLogin();
  return Response.json({ pengguna: kePengguna(profil) });
});

/** UC-05 Mengubah Profil: hanya nama (FR-04). */
export const PATCH = rute(async (req: Request) => {
  const konteks = await wajibLogin();
  const isi = await bacaJson(req);
  const nama = teks(isi.nama).trim();
  const galat = validasiNama(nama);
  if (galat) throw new GalatRute(400, galat, "data_tidak_valid");

  // Memakai klien pengguna: RLS dan izin kolom hanya membolehkan kolom nama.
  const { error } = await konteks.supabase.from("users").update({ nama }).eq("id", konteks.uid);
  if (error) throw error;

  return Response.json({ pengguna: kePengguna({ ...konteks.profil, nama }) });
});
