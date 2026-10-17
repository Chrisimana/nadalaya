import { SidebarAdmin } from "@/components/admin/SidebarAdmin";

// Hanya admin aktif yang dapat membuka halaman ini (diperiksa di proxy.ts).
export default function LayoutAdmin({ children }: LayoutProps<"/">) {
  return (
    <>
      <SidebarAdmin />
      <main className="flex flex-1 flex-col lg:pl-64">{children}</main>
    </>
  );
}
