import "server-only";
import { batasiDengan, buatPencatatSupabase, type AturanBatas } from "@/lib/pembatas";
import { klienAdmin } from "@/lib/supabase/admin";

const pencatat = buatPencatatSupabase((fungsi, argumen) => klienAdmin().rpc(fungsi, argumen as never));

/** Pembatas percobaan bersama (Supabase), dengan cadangan di memori bila migrasi-05 belum dijalankan. */
export function batasi(aturan: AturanBatas[]) {
  return batasiDengan(aturan, pencatat);
}
