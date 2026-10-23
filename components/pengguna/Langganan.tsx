"use client";

import { Check, CreditCard, Crown, QrCode, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { KepalaAplikasi } from "@/components/pengguna/KepalaAplikasi";
import { Alert } from "@/components/ui/Alert";
import { AlertServer, keGalatServer, type GalatServer } from "@/components/ui/AlertServer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { GagalMuat, Kerangka } from "@/components/ui/Memuat";
import { TombolUjiCoba } from "@/components/akses/TombolUjiCoba";
import { buatPesanan, getInfoLangganan } from "@/lib/api";
import { DAFTAR_PAKET, formatRupiah, type InfoPaket } from "@/lib/paket";
import { LABEL_PAKET, type KodePaketBerbayar } from "@/lib/types";
import { useMuat } from "@/lib/useMuat";
import { cn } from "@/lib/utils";
import { bolehUjiCoba, labelSisaHari, ringkasPaket } from "@/lib/statusPaket";

const PAKET_BERBAYAR = DAFTAR_PAKET.filter(
  (p): p is InfoPaket & { kode: KodePaketBerbayar } =>
    p.kode === "premium_bulanan" || p.kode === "persiapan_tes",
);

function KartuBeli({
  paket,
  onBayar,
  memuat,
  nonaktif,
}: {
  paket: InfoPaket;
  onBayar: () => void;
  memuat: boolean;
  nonaktif: boolean;
}) {
  return (
    <article
      className={cn(
        "flex flex-col rounded-2xl border bg-white p-6",
        paket.unggulan ? "border-nada-300 ring-2 ring-nada-100" : "border-garis",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-bold text-tinta">{paket.nama}</h3>
        {paket.unggulan && <Badge varian="kuningan">Paling diminati</Badge>}
      </div>
      <p className="mt-1 text-sm text-redup">{paket.ringkasan}</p>
      <p className="mt-4 flex items-baseline gap-1">
        <span className="font-serif text-3xl font-semibold text-nada-900">
          {formatRupiah(paket.harga)}
        </span>
        <span className="text-sm text-redup">/ {paket.satuan}</span>
      </p>
      {paket.catatan && (
        <p className="mt-1 text-xs font-medium text-kuningan-600">{paket.catatan}</p>
      )}
      <ul className="mt-5 flex flex-1 flex-col gap-2.5 text-sm">
        {paket.fitur.map((f) => (
          <li key={f} className="flex gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-nada-600" aria-hidden="true" />
            {f}
          </li>
        ))}
      </ul>
      <Button
        className="mt-6"
        lebarPenuh
        varian={paket.unggulan ? "utama" : "garis"}
        onClick={onBayar}
        memuat={memuat}
        disabled={nonaktif}
        ikon={<CreditCard className="size-4" aria-hidden="true" />}
      >
        Bayar {formatRupiah(paket.harga)}
      </Button>
    </article>
  );
}

export function Langganan() {
  const router = useRouter();
  const { keadaan, muatUlang } = useMuat(getInfoLangganan);
  const [diproses, setDiproses] = useState<KodePaketBerbayar | null>(null);
  const [galatServer, setGalatServer] = useState<{
    untuk: KodePaketBerbayar;
    galat: GalatServer;
  } | null>(null);
  const [ujiCobaBaruAktif, setUjiCobaBaruAktif] = useState(false);

  async function bayar(paket: KodePaketBerbayar) {
    setGalatServer(null);
    setDiproses(paket);
    try {
      const { orderId } = await buatPesanan(paket);
      // TODO: sambungkan ke Midtrans — buka pop-up Snap dengan snapToken
      router.push(`/langganan/status?order_id=${encodeURIComponent(orderId)}`);
    } catch (err) {
      setGalatServer({ untuk: paket, galat: keGalatServer(err) });
      setDiproses(null);
    }
  }

  const paket = keadaan.status === "siap" ? ringkasPaket(keadaan.data) : null;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6">
      <KepalaAplikasi
        judul="Langganan"
        deskripsi="Lihat status paket Anda, aktifkan uji coba, atau beli paket Premium."
      />

      {keadaan.status === "memuat" && <Kerangka jumlah={2} tinggi="h-32" />}
      {keadaan.status === "galat" && (
        <GagalMuat judul="Status langganan gagal dimuat" pesan={keadaan.pesan} onMuatUlang={muatUlang} />
      )}

      {keadaan.status === "siap" && (
        <>
          {ujiCobaBaruAktif && (
            <Alert varian="sukses" judul="Uji Coba Premium aktif">
              Selamat berlatih! Semua materi dan fitur Premium kini terbuka selama 7 hari.
            </Alert>
          )}
          <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-nada-700 text-white">
                <Crown className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-redup">Paket saat ini</p>
                <p className="text-xl font-bold text-tinta">
                  {LABEL_PAKET[keadaan.data.statusPaket]}
                </p>
                <p className="text-sm text-redup">
                  {paket?.sisaHari !== null && paket?.sisaHari !== undefined
                    ? `${paket.keterangan} · ${labelSisaHari(paket.sisaHari)}`
                    : "Tanpa masa berlaku. 3 analisis per hari dan materi tangga nada dasar."}
                </p>
              </div>
            </div>
          </Card>

          {bolehUjiCoba(keadaan.data) && (
            <section className="latar-paranada flex flex-col gap-4 rounded-2xl border border-kuningan-200 bg-kuningan-50 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-kuningan-600 ring-1 ring-kuningan-200">
                  <Sparkles className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-bold text-tinta">Coba Premium gratis selama 7 hari</h2>
                  <p className="text-sm text-redup">
                    Semua fitur Premium tanpa biaya. Hanya dapat diaktifkan satu kali per akun.
                  </p>
                </div>
              </div>
              <TombolUjiCoba
                ukuran="md"
                className="self-start sm:max-w-sm sm:self-auto"
                onBerhasil={() => {
                  setUjiCobaBaruAktif(true);
                  muatUlang();
                }}
              />
            </section>
          )}

          <section aria-labelledby="judul-beli" className="flex flex-col gap-5">
            <h2 id="judul-beli" className="font-serif text-2xl font-semibold text-nada-900">
              {keadaan.data.statusPaket === "gratis" ? "Pilih paket" : "Perpanjang paket"}
            </h2>
            {galatServer && (
              <AlertServer galat={galatServer.galat} judul="Pesanan belum dapat dibuat" />
            )}
            <div className="grid gap-5 md:grid-cols-2">
              {PAKET_BERBAYAR.map((p) => (
                <KartuBeli
                  key={p.kode}
                  paket={p}
                  onBayar={() => bayar(p.kode)}
                  memuat={diproses === p.kode}
                  nonaktif={diproses !== null && diproses !== p.kode}
                />
              ))}
            </div>
            <div className="flex flex-col gap-2 rounded-xl border border-garis bg-white p-4 text-sm text-redup sm:flex-row sm:items-center sm:gap-4">
              <span className="flex items-center gap-2 font-semibold text-tinta">
                <CreditCard className="size-4" aria-hidden="true" />
                Virtual Account
                <QrCode className="ml-2 size-4" aria-hidden="true" />
                QRIS
              </span>
              <p>
                Pembayaran diproses melalui Midtrans. Paket aktif setelah
                pembayaran terkonfirmasi. Jika paket masih aktif, masa aktif
                baru ditambahkan ke sisa masa aktif.
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
