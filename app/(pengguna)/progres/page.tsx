import type { Metadata } from "next";
import { Progres } from "@/components/progres/Progres";

export const metadata: Metadata = { title: "Grafik Progres" };

export default function HalamanProgres() {
  return <Progres />;
}
