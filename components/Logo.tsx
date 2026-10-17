import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
  /** Lebar dan tinggi logo dalam piksel (logo berbentuk persegi). */
  ukuran?: number;
  /** Menampilkan teks "Nadalaya" di sebelah logo. */
  denganTeks?: boolean;
  /** Bila diisi, logo dan teks menjadi satu tautan. */
  href?: string;
  /** Muat lebih awal untuk logo yang tampil di atas lipatan (navbar). */
  prioritas?: boolean;
  className?: string;
  /** Kelas tambahan untuk teks, misalnya ukuran huruf. */
  kelasTeks?: string;
};

/** Logo Nadalaya dari /nadalaya-logo.svg, dengan teks opsional. */
export function Logo({
  ukuran = 32,
  denganTeks = true,
  href,
  prioritas,
  className,
  kelasTeks,
}: Props) {
  const isi = (
    <>
      <Image
        src="/nadalaya-logo.svg"
        alt="Nadalaya"
        width={ukuran}
        height={ukuran}
        loading={prioritas ? "eager" : undefined}
        className="shrink-0"
        style={{ width: ukuran, height: ukuran }}
      />
      {denganTeks && (
        // Nama sudah dibacakan dari alt logo, jadi teks disembunyikan dari pembaca layar.
        <span
          aria-hidden="true"
          className={cn(
            "font-serif text-xl leading-none font-semibold tracking-tight text-nada-800",
            kelasTeks,
          )}
        >
          Nadalaya
        </span>
      )}
    </>
  );

  const kelas = cn("inline-flex items-center gap-2", className);

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          kelas,
          "rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-kuningan-400",
        )}
      >
        {isi}
      </Link>
    );
  }
  return <span className={kelas}>{isi}</span>;
}
