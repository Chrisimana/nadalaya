import type { Metadata } from "next";
import { StatistikAdmin } from "@/components/admin/StatistikAdmin";

export const metadata: Metadata = { title: "Statistik Latihan" };

export default function HalamanStatistik() {
  return <StatistikAdmin />;
}
