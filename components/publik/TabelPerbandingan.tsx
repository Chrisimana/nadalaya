import { Check, Minus } from "lucide-react";
import {
  DAFTAR_PAKET,
  formatRupiah,
  PERBANDINGAN_HAK_AKSES,
  type NilaiHakAkses,
} from "@/lib/paket";
import { cn } from "@/lib/utils";

function Sel({ nilai }: { nilai: NilaiHakAkses }) {
  if (nilai === true) {
    return (
      <>
        <Check className="mx-auto size-5 text-nada-600" aria-hidden="true" />
        <span className="sr-only">Tersedia</span>
      </>
    );
  }
  if (nilai === false) {
    return (
      <>
        <Minus className="mx-auto size-5 text-redup/50" aria-hidden="true" />
        <span className="sr-only">Tidak tersedia</span>
      </>
    );
  }
  return <span className="font-medium text-tinta">{nilai}</span>;
}

/** Tabel perbandingan hak akses keempat paket. */
export function TabelPerbandingan() {
  const indeksUnggulan = DAFTAR_PAKET.findIndex((p) => p.unggulan);

  return (
    <div className="overflow-x-auto rounded-2xl border border-garis bg-white">
      <table className="w-full min-w-[640px] text-sm">
        <caption className="sr-only">
          Perbandingan hak akses paket Gratis, Uji Coba Premium, Premium, dan
          Paket Persiapan Tes
        </caption>
        <thead>
          <tr className="border-b border-garis">
            <th
              scope="col"
              className="w-[28%] px-5 py-4 text-left text-xs font-semibold tracking-wide text-redup uppercase"
            >
              Hak akses
            </th>
            {DAFTAR_PAKET.map((p, i) => (
              <th
                key={p.kode}
                scope="col"
                className={cn(
                  "px-4 py-4 text-center align-bottom",
                  i === indeksUnggulan && "bg-nada-50",
                )}
              >
                <span className="block font-bold text-tinta">{p.nama}</span>
                <span className="mt-0.5 block text-xs font-medium text-redup">
                  {p.harga === 0 ? "Rp0" : formatRupiah(p.harga)} / {p.satuan}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-garis">
          {PERBANDINGAN_HAK_AKSES.map((baris) => (
            <tr key={baris.fitur}>
              <th
                scope="row"
                className="px-5 py-3.5 text-left font-medium text-tinta"
              >
                {baris.fitur}
              </th>
              {baris.nilai.map((nilai, i) => (
                <td
                  key={DAFTAR_PAKET[i].kode}
                  className={cn(
                    "px-4 py-3.5 text-center",
                    i === indeksUnggulan && "bg-nada-50",
                  )}
                >
                  <Sel nilai={nilai} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
