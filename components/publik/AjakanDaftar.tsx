import { Button } from "@/components/ui/Button";

export function AjakanDaftar({
  judul = "Siap menyanyikan nada pertama?",
  deskripsi = "Siapkan headphone dan mikrofon, lalu mulai latihan pertama Anda.",
}: {
  judul?: string;
  deskripsi?: string;
}) {
  return (
    <section className="bg-nada-800">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-serif text-3xl font-semibold text-white">
            {judul}
          </h2>
          <p className="mt-2 text-nada-200">{deskripsi}</p>
        </div>
        <Button href="/daftar" varian="aksen" ukuran="lg">
          Daftar
        </Button>
      </div>
    </section>
  );
}
