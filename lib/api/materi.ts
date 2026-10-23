import type { Materi } from "@/lib/types";
import { minta } from "./klien";

export async function getMateriList(): Promise<Materi[]> {
  const hasil = await minta<{ materi: Materi[] }>("/api/materi");
  return hasil.materi;
}
