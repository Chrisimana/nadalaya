import type { Materi } from "@/lib/types";
import { minta } from "./klien";

/** UC-06 Melihat Daftar Materi (FR-07). Materi premium ditandai terkunci. */
export async function getMateriList(): Promise<Materi[]> {
  const hasil = await minta<{ materi: Materi[] }>("/api/materi");
  return hasil.materi;
}
