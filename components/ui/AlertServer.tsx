import { Alert } from "@/components/ui/Alert";
import { adalahBelumTersambung, pesanGalat } from "@/lib/api";

export type GalatServer = { pesan: string; belumTersambung: boolean };

/** Mengubah galat dari lib/api menjadi data untuk AlertServer. */
export function keGalatServer(err: unknown): GalatServer {
  return { pesan: pesanGalat(err), belumTersambung: adalahBelumTersambung(err) };
}

/**
 * Alert untuk galat dari server. Selama back-end belum tersambung, pesan
 * tampil sebagai peringatan (kuning), bukan galat (merah).
 */
export function AlertServer({
  galat,
  judul,
  className,
}: {
  galat: GalatServer | null;
  judul: string;
  className?: string;
}) {
  if (!galat) return null;
  return (
    <Alert
      varian={galat.belumTersambung ? "peringatan" : "galat"}
      judul={judul}
      className={className}
    >
      {galat.pesan}
    </Alert>
  );
}
