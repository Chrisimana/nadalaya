import type { Metadata } from "next";
import { Langganan } from "@/components/pengguna/Langganan";

export const metadata: Metadata = { title: "Langganan" };

export default function HalamanLangganan() {
  return <Langganan />;
}
