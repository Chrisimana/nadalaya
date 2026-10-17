"use client";

import { useCallback, useRef, useState } from "react";
import {
  adalahBelumTersambung,
  batalkanSesiAnalisis,
  mulaiSesiAnalisis,
  simpanRiwayat,
} from "@/lib/api";
import type { HasilAnalisis, NadaAcuan } from "@/lib/types";
import { jalankanAnalisis } from "./analisis";
import { ModelGagalDimuatError, NadaTidakTerdeteksiError } from "./crepe";
import type { HasilRekaman } from "./recorder";

export type AlasanGagal =
  | "belum_tersambung"
  | "kuota_habis"
  | "materi_premium"
  | "acuan_tidak_tersedia"
  | "model_gagal"
  | "nada_tidak_terdeteksi"
  | "lainnya";

export type KeadaanAnalisis =
  | { tahap: "siap" }
  | { tahap: "memeriksa_kuota" | "memuat_model" | "menganalisis" | "menyimpan" }
  | { tahap: "gagal"; alasan: AlasanGagal; pesan?: string; waktuReset?: string }
  | { tahap: "selesai"; hasil: HasilAnalisis; riwayatTersimpan: boolean };

export const TAHAP_PROSES = [
  "memeriksa_kuota",
  "memuat_model",
  "menganalisis",
] as const;

type Tersimpan = { rekaman: Blob; keadaan: KeadaanAnalisis };

/**
 * Mengelola satu analisis untuk rekaman tertentu. Bila rekaman berganti
 * (Rekam Ulang), keadaan otomatis kembali ke "siap".
 */
export function useAnalisis({
  materiId,
  acuan,
  rekaman,
}: {
  materiId: string;
  acuan: NadaAcuan[] | null | undefined;
  rekaman: HasilRekaman | null;
}) {
  const [simpanan, setSimpanan] = useState<Tersimpan | null>(null);
  const berjalan = useRef(false);

  const keadaan: KeadaanAnalisis =
    simpanan && rekaman && simpanan.rekaman === rekaman.blob
      ? simpanan.keadaan
      : { tahap: "siap" };

  const mulai = useCallback(async () => {
    if (!rekaman || berjalan.current) return;
    if (rekaman.terlaluPendek || rekaman.tanpaSuara) return;
    berjalan.current = true;
    const blob = rekaman.blob;
    const set = (k: KeadaanAnalisis) => setSimpanan({ rekaman: blob, keadaan: k });

    try {
      // UC-12 langkah 1.1–1.2: periksa ulang kuota lalu catat sesi di server.
      set({ tahap: "memeriksa_kuota" });
      let sesiId: string;
      try {
        const sesi = await mulaiSesiAnalisis(materiId);
        if ("diizinkan" in sesi) {
          set(
            sesi.alasan === "kuota_habis"
              ? { tahap: "gagal", alasan: "kuota_habis", waktuReset: sesi.waktuReset }
              : { tahap: "gagal", alasan: "materi_premium" },
          );
          return;
        }
        sesiId = sesi.sesiId;
      } catch (err) {
        set({
          tahap: "gagal",
          alasan: adalahBelumTersambung(err) ? "belum_tersambung" : "lainnya",
        });
        return;
      }

      // Sesi yang gagal ditandai batal agar tidak dihitung sebagai kuota (FR-09).
      const gagal = (alasan: AlasanGagal) => {
        set({ tahap: "gagal", alasan });
        batalkanSesiAnalisis(sesiId).catch(() => {});
      };

      if (!acuan || acuan.length === 0) return gagal("acuan_tidak_tersedia");

      let hasil: HasilAnalisis;
      try {
        hasil = await jalankanAnalisis({
          rekaman: blob,
          acuan,
          onTahap: (tahap) => set({ tahap }),
        });
      } catch (err) {
        if (err instanceof ModelGagalDimuatError) return gagal("model_gagal");
        if (err instanceof NadaTidakTerdeteksiError) {
          return gagal("nada_tidak_terdeteksi");
        }
        return gagal("lainnya");
      }

      // UC-13: simpan riwayat; bila gagal, skor tetap ditampilkan.
      set({ tahap: "menyimpan" });
      let riwayatTersimpan = true;
      try {
        await simpanRiwayat({
          sesiId,
          materiId,
          skor: hasil.skor,
          ringkasanKontur: hasil.kontur,
        });
      } catch {
        riwayatTersimpan = false;
      }
      set({ tahap: "selesai", hasil, riwayatTersimpan });
    } finally {
      berjalan.current = false;
    }
  }, [materiId, acuan, rekaman]);

  /** Kembali ke keadaan siap untuk rekaman yang sama (misalnya Coba Lagi). */
  const reset = useCallback(() => setSimpanan(null), []);

  return { keadaan, mulai, reset };
}
