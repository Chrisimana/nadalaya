import { ArrowLeft } from "lucide-react";
import Link from "next/link";

// Grup autentikasi: tampilan fokus tanpa navbar dan footer, kartu di tengah.
export default function LayoutAuth({ children }: LayoutProps<"/">) {
  return (
    <main className="latar-paranada flex min-h-dvh flex-1 flex-col px-4 py-5 sm:px-8 sm:py-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 self-start rounded-lg py-1 text-sm font-semibold text-redup hover:text-nada-800"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Kembali ke beranda
      </Link>
      <div className="flex flex-1 items-center justify-center py-8">
        {children}
      </div>
    </main>
  );
}
