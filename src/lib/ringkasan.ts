import type { Transaction } from "@/interface/types";

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
  porsiLuring: number;
  porsiShopee: number;
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
    porsiLuring: 0,
    porsiShopee: 0,
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
        r.porsiLuring += qty;
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
