import { Mail } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { EMAIL_KONTAK } from "@/lib/kontak";

const kolom = [
  {
    judul: "Jelajahi",
    tautan: [
      { href: "/", label: "Beranda" },
      { href: "/harga", label: "Harga" },
      { href: "/tentang", label: "Tentang" },
    ],
  },
  {
    judul: "Legal",
    tautan: [
      { href: "/kebijakan-privasi", label: "Kebijakan Privasi" },
      { href: "/syarat-ketentuan", label: "Syarat & Ketentuan" },
    ],
  },
];

/** Footer halaman publik: identitas, navigasi, dan tautan legal. */
export function Footer() {
  return (
    <footer className="mt-auto border-t border-garis bg-white/60 text-sm">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 py-12 md:grid-cols-[1.6fr_1fr_1fr]">
          <div className="flex flex-col gap-4">
            <Logo href="/" ukuran={30} kelasTeks="text-lg" className="self-start" />
            <p className="max-w-sm leading-relaxed text-redup">
              Latihan solfeggio dengan analisis nada otomatis untuk persiapan
              tes keterampilan musik.
            </p>
            <a
              href={`mailto:${EMAIL_KONTAK}`}
              className="inline-flex items-center gap-2 self-start font-medium text-nada-700 underline-offset-4 hover:underline"
            >
              <Mail className="size-4" aria-hidden="true" />
              {EMAIL_KONTAK}
            </a>
          </div>

          {kolom.map((k) => (
            <nav key={k.judul} aria-labelledby={`footer-${k.judul}`}>
              <h2
                id={`footer-${k.judul}`}
                className="text-xs font-bold tracking-wide text-tinta uppercase"
              >
                {k.judul}
              </h2>
              <ul className="mt-4 flex flex-col gap-3">
                {k.tautan.map((t) => (
                  <li key={t.href}>
                    <Link
                      href={t.href}
                      className="text-redup underline-offset-4 hover:text-nada-800 hover:underline"
                    >
                      {t.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="flex flex-col gap-2 border-t border-garis py-6 text-redup sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Nadalaya. Seluruh hak cipta dilindungi.</p>
          <p className="font-serif italic">Setiap nada berarti.</p>
        </div>
      </div>
    </footer>
  );
}
