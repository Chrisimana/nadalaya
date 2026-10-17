import type { Metadata } from "next";
import { DashboardAdmin } from "@/components/admin/DashboardAdmin";

export const metadata: Metadata = { title: "Dashboard Admin" };

export default function HalamanDashboardAdmin() {
  return <DashboardAdmin />;
}
