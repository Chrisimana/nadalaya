"use client";

import { useCallback, useEffect, useState } from "react";
import { pesanGalat } from "@/lib/api";

export type KeadaanMuat<T> =
  | { status: "memuat" }
  | { status: "galat"; pesan: string }
  | { status: "siap"; data: T };

/**
 * Memuat data dari fungsi lib/api saat komponen tampil.
 * `ambil` harus stabil (fungsi modul atau dibungkus useCallback).
 */
export function useMuat<T>(ambil: () => Promise<T>) {
  const [keadaan, setKeadaan] = useState<KeadaanMuat<T>>({ status: "memuat" });
  const [putaran, setPutaran] = useState(0);

  useEffect(() => {
    let aktif = true;
    ambil()
      .then((data) => aktif && setKeadaan({ status: "siap", data }))
      .catch(
        (err) =>
          aktif && setKeadaan({ status: "galat", pesan: pesanGalat(err) }),
      );
    return () => {
      aktif = false;
    };
  }, [ambil, putaran]);

  const muatUlang = useCallback(() => {
    setKeadaan({ status: "memuat" });
    setPutaran((p) => p + 1);
  }, []);

  return { keadaan, muatUlang };
}
