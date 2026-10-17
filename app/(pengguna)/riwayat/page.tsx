import type { Metadata } from "next";
import { RiwayatLatihan } from "@/components/riwayat/RiwayatLatihan";

export const metadata: Metadata = { title: "Riwayat Latihan" };

export default function HalamanRiwayat() {
  return <RiwayatLatihan />;
}
