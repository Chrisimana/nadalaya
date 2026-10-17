import type { Metadata } from "next";
import { Profil } from "@/components/pengguna/Profil";

export const metadata: Metadata = { title: "Profil" };

export default function HalamanProfil() {
  return <Profil />;
}
