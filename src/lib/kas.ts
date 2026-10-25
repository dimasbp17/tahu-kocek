import type { MetodeBayar, Transaction } from "@/interface/types";

// Transaksi lama tanpa metode bayar dianggap tunai
export const metodeBayar = (t: Transaction): MetodeBayar =>
  t.payment ?? "tunai";

// Uang yang lewat laci: penjualan Langsung & pengeluaran, bukan Shopee
export const lewatLaci = (t: Transaction) =>
  t.type === "OUT" || t.source !== "shopee";

export function labelMetode(t: Transaction) {
  if (!lewatLaci(t)) return "";
  if (metodeBayar(t) === "tunai") return "Tunai";
  return t.type === "IN" ? "QRIS" : "Transfer/QRIS";
}

// "2026-10-26" dalam jam lokal (WIB), dipakai sebagai id dokumen tutup kas
export function kunciTanggal(d: Date) {
  const dua = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${dua(d.getMonth() + 1)}-${dua(d.getDate())}`;
}

export function awalTanggal(kunci: string) {
  const [y, m, d] = kunci.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// Arus uang tunai di laci pada satu tanggal
export function hitungKasTunai(transaksi: Transaction[], kunci: string) {
  const mulai = awalTanggal(kunci);
  const akhir = new Date(mulai);
  akhir.setDate(akhir.getDate() + 1);

  const r = {
    masuk: 0,
    jumlahPenjualan: 0,
    belanja: 0,
    tarik: 0,
  };
  for (const t of transaksi) {
    const d = new Date(t.date);
    if (d < mulai || d >= akhir) continue;
    if (!lewatLaci(t) || metodeBayar(t) !== "tunai") continue;
    if (t.type === "IN") {
      r.masuk += t.amount;
      r.jumlahPenjualan++;
    } else if (t.category === "tarik") {
      r.tarik += t.amount;
    } else {
      r.belanja += t.amount;
    }
  }
  return { ...r, keluar: r.belanja + r.tarik };
}
