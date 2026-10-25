import type { PorsiPerLevel, Settings } from "@/interface/types";
import { teksLevel } from "@/lib/level";

export type SumberPesanan = "luring" | "shopee";

// Rincian satu pesanan berdasarkan harga, komisi, dan HPP di Setelan.
// Dipakai bersama oleh Kasir dan Edit Transaksi supaya rumusnya sama.
export function hitungPesanan(
  settings: Settings,
  sumber: SumberPesanan,
  qty: number,
  voucher: number,
) {
  const hargaSatuan =
    sumber === "luring" ? settings.hargaLuring : settings.hargaShopee;
  const hargaJual = qty * hargaSatuan;
  const komisi =
    sumber === "shopee"
      ? Math.round(hargaJual * (settings.komisiShopee / 100))
      : 0;
  const diskon = sumber === "shopee" ? voucher : 0;
  const diterima = Math.max(0, hargaJual - diskon - komisi);
  const laba = diterima - qty * (settings.hppPerPorsi || 0);
  return { hargaJual, komisi, diskon, diterima, laba };
}

export function deskripsiPesanan(
  sumber: SumberPesanan,
  qty: number,
  diskon: number,
  levels?: PorsiPerLevel,
) {
  const rincianLevel = teksLevel(levels);
  return `Pesanan ${sumber === "luring" ? "Luring" : "Shopee"} (${qty} porsi${rincianLevel ? `: ${rincianLevel}` : ""})${diskon > 0 ? ` - Diskon Rp${diskon.toLocaleString("id-ID")}` : ""}`;
}

// Pesan error kalau potongan voucher tidak valid, atau null kalau aman
export function cekVoucher(diskon: number, hargaJual: number) {
  if (!Number.isInteger(diskon) || diskon < 0) {
    return "Potongan voucher harus angka bulat, tidak boleh minus";
  }
  if (diskon > hargaJual) return "Potongan voucher melebihi harga jual";
  return null;
}
