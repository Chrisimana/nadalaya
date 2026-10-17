import type { Metadata } from "next";
import { KelolaMateri } from "@/components/admin/KelolaMateri";

export const metadata: Metadata = { title: "Kelola Materi" };

export default function HalamanKelolaMateri() {
  return <KelolaMateri />;
}
