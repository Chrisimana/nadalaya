import { ArrowDown, ArrowUp, CircleCheck, MicOff } from "lucide-react";
import { namaNada } from "@/lib/audio/nada";
import type { NadaAcuan, NadaMeleset } from "@/lib/types";

/** FR-14: daftar nada yang meleset lebih dari 50 cent. */
export function DaftarNadaMeleset({
  nadaMeleset,
}: {
  nadaMeleset: NadaMeleset[];
}) {
  if (nadaMeleset.length === 0) {
    return (
      <p className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
        <CircleCheck className="size-5 shrink-0" aria-hidden="true" />
        Tidak ada nada yang meleset lebih dari 50 cent. Bagus sekali!
      </p>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-garis rounded-xl border border-garis">
      {nadaMeleset.map((m) => {
        const tinggi = m.selisihCent !== null && m.selisihCent > 0;
        const Ikon = m.selisihCent === null ? MicOff : tinggi ? ArrowUp : ArrowDown;
        return (
          <li key={m.urutan} className="flex items-center gap-3 px-4 py-3 text-sm">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-700">
              <Ikon className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-tinta">
                Nada ke-{m.urutan} · {namaNada(m.midiAcuan)}
              </p>
              <p className="text-redup">
                {m.selisihCent === null
                  ? "Tidak terdeteksi"
                  : `Terlalu ${tinggi ? "tinggi" : "rendah"} ${Math.abs(Math.round(m.selisihCent))} cent`}{" "}
                · detik {m.waktu.toFixed(1)}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Tabel seluruh nada acuan sebagai tampilan alternatif grafik. */
export function TabelNada({
  acuan,
  nadaMeleset,
}: {
  acuan: NadaAcuan[];
  nadaMeleset: NadaMeleset[];
}) {
  const meleset = new Map(nadaMeleset.map((m) => [m.urutan, m]));
  return (
    <div className="overflow-x-auto rounded-xl border border-garis">
      <table className="w-full text-left text-sm">
        <thead className="bg-nada-50/60 text-xs tracking-wide text-redup uppercase">
          <tr>
            <th className="px-4 py-2.5 font-semibold">No.</th>
            <th className="px-4 py-2.5 font-semibold">Nada acuan</th>
            <th className="px-4 py-2.5 font-semibold">Detik</th>
            <th className="px-4 py-2.5 font-semibold">Hasil</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-garis">
          {acuan.map((n, i) => {
            const m = meleset.get(i + 1);
            return (
              <tr key={i}>
                <td className="px-4 py-2.5 tabular-nums">{i + 1}</td>
                <td className="px-4 py-2.5 font-medium">{namaNada(n.midi)}</td>
                <td className="px-4 py-2.5 tabular-nums">{n.waktu.toFixed(1)}</td>
                <td className="px-4 py-2.5">
                  {m ? (
                    <span className="font-semibold text-red-700">
                      {m.selisihCent === null
                        ? "Tidak terdeteksi"
                        : `Meleset ${m.selisihCent > 0 ? "+" : "−"}${Math.abs(Math.round(m.selisihCent))} cent`}
                    </span>
                  ) : (
                    <span className="text-emerald-700">Tepat</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
