import type { Metadata } from "next";
import { DaftarMateri } from "@/components/materi/DaftarMateri";

export const metadata: Metadata = { title: "Materi Latihan" };

export default function HalamanMateri() {
  return <DaftarMateri />;
}
