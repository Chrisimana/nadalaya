import type { Metadata } from "next";
import { KelolaPengguna } from "@/components/admin/KelolaPengguna";

export const metadata: Metadata = { title: "Kelola Pengguna" };

export default function HalamanKelolaPengguna() {
  return <KelolaPengguna />;
}
