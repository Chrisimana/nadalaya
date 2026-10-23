import type { ReactNode } from "react";

export function KepalaHalaman({
  judul,
  children,
}: {
  judul: string;
  children?: ReactNode;
}) {
  return (
    <section className="latar-paranada border-b border-garis">
      <div className="mx-auto max-w-6xl px-4 pt-14 pb-12 sm:px-6 lg:pt-20 lg:pb-16">
        <h1 className="max-w-3xl font-serif text-4xl leading-[1.1] font-semibold tracking-tight text-nada-900 sm:text-5xl">
          {judul}
        </h1>
        {children && (
          <div className="mt-5 max-w-2xl text-lg leading-relaxed text-redup">
            {children}
          </div>
        )}
      </div>
    </section>
  );
}
