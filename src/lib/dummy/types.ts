/**
 * Shim lama. Tipe domain kini tinggal di src/db/types.ts; file ini hanya
 * re-export supaya 18 import lama tidak perlu diubah satu per satu.
 */
export type * from "@/db/types";