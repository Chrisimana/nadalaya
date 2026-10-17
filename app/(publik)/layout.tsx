import { Footer } from "@/components/layout/Footer";
import { Navbar, type TautanNav } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";

const tautanPublik: TautanNav[] = [
  { href: "/", label: "Beranda" },
  { href: "/harga", label: "Harga" },
  { href: "/tentang", label: "Tentang" },
];

export default function LayoutPublik({ children }: LayoutProps<"/">) {
  return (
    <>
      <Navbar
        tautan={tautanPublik}
        aksi={
          <>
            <Button href="/masuk" varian="hantu" ukuran="sm">
              Masuk
            </Button>
            <Button href="/daftar" ukuran="sm">
              Daftar
            </Button>
          </>
        }
        aksiPonsel={
          <>
            <Button href="/masuk" varian="garis" lebarPenuh>
              Masuk
            </Button>
            <Button href="/daftar" lebarPenuh>
              Daftar
            </Button>
          </>
        }
      />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
    </>
  );
}
