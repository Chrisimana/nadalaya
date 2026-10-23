import type { ReactNode } from "react";

export type BagianLegal = { id: string; judul: string; isi: ReactNode };

export function DokumenLegal({
  judul,
  pengantar,
  diperbarui,
  bagian,
}: {
  judul: string;
  pengantar: ReactNode;
  diperbarui: string;
  bagian: BagianLegal[];
}) {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <header className="border-b border-garis pb-8">
        <h1 className="font-serif text-4xl font-semibold tracking-tight text-nada-900 sm:text-5xl">
          {judul}
        </h1>
        <p className="mt-3 text-sm text-redup">
          Terakhir diperbarui: {diperbarui}
        </p>
        <div className="mt-6 leading-relaxed text-tinta">{pengantar}</div>
      </header>

      <nav aria-labelledby="judul-daftar-isi" className="border-b border-garis py-8">
        <h2
          id="judul-daftar-isi"
          className="text-xs font-bold tracking-wide text-redup uppercase"
        >
          Daftar isi
        </h2>
        <ol className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          {bagian.map((b, i) => (
            <li key={b.id}>
              <a
                href={`#${b.id}`}
                className="text-nada-700 underline-offset-4 hover:underline"
              >
                {i + 1}. {b.judul}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="flex flex-col gap-10 pt-10">
        {bagian.map((b, i) => (
          <section key={b.id} id={b.id} className="scroll-mt-24">
            <h2 className="font-serif text-2xl font-semibold text-nada-900">
              {i + 1}. {b.judul}
            </h2>
            <div className="mt-4 flex flex-col gap-4 leading-relaxed text-tinta [&_li]:pl-1 [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5 [&_ul]:marker:text-kuningan-500">
              {b.isi}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
