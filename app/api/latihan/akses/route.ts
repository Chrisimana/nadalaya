import { periksaAkses } from "@/lib/server/akses";
import { ambilMateriAktif, keMateri, urlMidi } from "@/lib/server/materi";
import { wajibLogin } from "@/lib/server/pengguna";
import { bacaJson, rute, wajibUuid } from "@/lib/server/respons";

export const POST = rute(async (req: Request) => {
  const konteks = await wajibLogin();
  const isi = await bacaJson(req);
  const materiId = wajibUuid(isi.materiId, "ID materi");

  const baris = await ambilMateriAktif(materiId);
  const akses = await periksaAkses(konteks, baris);
  const materi = keMateri(baris, konteks.paket);

  if (!akses.diizinkan) return Response.json({ akses, materi });
  return Response.json({ akses, materi, midiUrl: await urlMidi(baris.midi_path) });
});
