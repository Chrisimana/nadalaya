import { Music2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function TidakDitemukan() {
  return (
    <main className="latar-paranada flex min-h-dvh flex-1 flex-col items-center justify-center gap-8 px-4 py-16">
      <Logo href="/" ukuran={40} />
      <div className="w-full max-w-xl">
        <p className="text-center font-serif text-6xl font-semibold text-nada-200">404</p>
        <EmptyState
          className="mt-4 bg-white"
          ikon={Music2}
          judul="Halaman tidak ditemukan"
          deskripsi="Nada yang Anda cari sepertinya sumbang. Periksa kembali alamat halaman atau kembali ke beranda."
          aksi={
            <>
              <Button href="/">Kembali ke Beranda</Button>
              <Button href="/dashboard" varian="garis">
                Ke Dashboard
              </Button>
            </>
          }
        />
      </div>
    </main>
  );
}
