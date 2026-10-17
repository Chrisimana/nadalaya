import type { Metadata } from "next";
import { Suspense } from "react";
import { StatusPembayaran } from "@/components/pengguna/StatusPembayaran";
import { Memuat } from "@/components/ui/Memuat";
import type { StatusTransaksi } from "@/lib/types";

export const metadata: Metadata = { title: "Status Pembayaran" };

/**
 * Status dari parameter alamat: `status` (internal) atau `transaction_status`
 * yang dikirim Midtrans saat mengarahkan kembali ke Nadalaya.
 */
function statusDariParameter(
  sp: Record<string, string | string[] | undefined>,
): StatusTransaksi | null {
  const nilai = typeof sp.status === "string" ? sp.status : sp.transaction_status;
  switch (nilai) {
    case "berhasil":
    case "settlement":
    case "capture":
      return "berhasil";
    case "tertunda":
    case "pending":
      return "tertunda";
    case "gagal":
    case "deny":
    case "cancel":
    case "failure":
      return "gagal";
    case "kedaluwarsa":
    case "expire":
      return "kedaluwarsa";
    default:
      return null;
  }
}

export default function HalamanStatusPembayaran({
  searchParams,
}: PageProps<"/langganan/status">) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <Suspense fallback={<Memuat teks="Memeriksa status pembayaran…" />}>
        {searchParams.then((sp) => (
          <StatusPembayaran
            orderId={typeof sp.order_id === "string" ? sp.order_id : null}
            statusDariUrl={statusDariParameter(sp)}
          />
        ))}
      </Suspense>
    </div>
  );
}
