import { Alert } from "@/components/ui/Alert";
import { adalahBelumTersambung, pesanGalat } from "@/lib/api";

export type GalatServer = { pesan: string; belumTersambung: boolean };

export function keGalatServer(err: unknown): GalatServer {
  return { pesan: pesanGalat(err), belumTersambung: adalahBelumTersambung(err) };
}

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
