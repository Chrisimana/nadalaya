import { HeaderAplikasi } from "@/components/layout/HeaderAplikasi";

// Halaman di grup ini wajib login. Pemeriksaan sesi akan ditambahkan
// lewat middleware/proxy Next.js saat Supabase Auth tersambung.
export default function LayoutPengguna({ children }: LayoutProps<"/">) {
  return (
    <>
      <HeaderAplikasi />
      {/* Ruang bawah di ponsel agar konten tidak tertutup bilah menu. */}
      <main className="flex flex-1 flex-col pb-20 md:pb-0">{children}</main>
    </>
  );
}
