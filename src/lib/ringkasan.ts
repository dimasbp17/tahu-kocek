import type { Transaction } from "@/interface/types";
import { LEVEL } from "@/lib/level";
import { metodeBayar } from "@/lib/kas";

export interface Ringkasan {
  omset: number; // Pendapatan (sudah dipotong komisi & voucher)
  laba: number; // Estimasi laba (pendapatan − HPP)
  belanja: number;
  tarik: number;
  porsi: number;
  labaReal: number; // Pendapatan − belanja bahan
  arusKas: number; // Pendapatan − belanja − tarik laba
  omsetLuring: number;
  omsetShopee: number;
  omsetTunai: number; // Bagian dari omsetLuring
  omsetQris: number; // Bagian dari omsetLuring
  porsiLuring: number;
  porsiShopee: number;
  porsiPerLevel: Record<(typeof LEVEL)[number], number>;
  porsiTanpaLevel: number; // Penjualan yang dicatat sebelum ada level
}

// Satu sumber rumus untuk Ringkasan, Laporan, dan ekspor Excel.
// Tarik laba bukan biaya, jadi dipisah dari belanja bahan.
export function hitungRingkasan(transaksi: Transaction[]): Ringkasan {
  const r: Ringkasan = {
    omset: 0,
    laba: 0,
    belanja: 0,
    tarik: 0,
    porsi: 0,
    labaReal: 0,
    arusKas: 0,
    omsetLuring: 0,
    omsetShopee: 0,
    omsetTunai: 0,
    omsetQris: 0,
    porsiLuring: 0,
    porsiShopee: 0,
    porsiPerLevel: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
    porsiTanpaLevel: 0,
  };
  for (const t of transaksi) {
    if (t.type === "IN") {
      const qty = t.qty || 0;
      r.omset += t.amount;
      r.laba += t.netProfit || 0;
      r.porsi += qty;
      if (t.source === "shopee") {
        r.omsetShopee += t.amount;
        r.porsiShopee += qty;
      } else {
        r.omsetLuring += t.amount;
        if (metodeBayar(t) === "tunai") r.omsetTunai += t.amount;
        else r.omsetQris += t.amount;
        r.porsiLuring += qty;
      }
      if (t.levels) {
        for (const l of LEVEL) r.porsiPerLevel[l] += t.levels[l] ?? 0;
      } else {
        r.porsiTanpaLevel += qty;
      }
    } else if (t.category === "tarik") {
      r.tarik += t.amount;
    } else {
      r.belanja += t.amount;
    }
  }
  r.labaReal = r.omset - r.belanja;
  r.arusKas = r.labaReal - r.tarik;
  return r;
}
