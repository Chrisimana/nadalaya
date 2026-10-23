import { HeaderAplikasi } from "@/components/layout/HeaderAplikasi";

// Halaman di grup ini wajib login (diperiksa di proxy.ts).
export default function LayoutPengguna({ children }: LayoutProps<"/">) {
  return (
    <>
      <HeaderAplikasi />
      <main className="flex flex-1 flex-col pb-20 md:pb-0">{children}</main>
    </>
  );
}
