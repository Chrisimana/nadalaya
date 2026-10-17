import { SidebarAdmin } from "@/components/admin/SidebarAdmin";

// TODO: lindungi dengan middleware peran admin (cek sesi, is_aktif, dan
// peran = admin) saat Supabase Auth tersambung. Untuk sementara halaman
// admin dapat dibuka langsung.
export default function LayoutAdmin({ children }: LayoutProps<"/">) {
  return (
    <>
      <SidebarAdmin />
      <main className="flex flex-1 flex-col lg:pl-64">{children}</main>
    </>
  );
}
