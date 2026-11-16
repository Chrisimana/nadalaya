import type { Metadata } from "next";
import { Langganan } from "@/components/pengguna/Langganan";
import { alamatMidtrans, modeProduksiMidtrans } from "@/lib/midtrans";

export const metadata: Metadata = { title: "Langganan" };

export default function HalamanLangganan() {
  // snap.js dimuat hanya di halaman ini.
  const snap = {
    url: alamatMidtrans(modeProduksiMidtrans()).snapJs,
    clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "",
  };
  return <Langganan snap={snap} />;
}
