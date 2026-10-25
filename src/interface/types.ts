export interface Transaction {
  category: string;
  id: string;
  type: "IN" | "OUT";
  source?: string;
  qty?: number;
  amount: number;
  discount?: number;
  netProfit?: number; // Tambahan: Keuntungan bersih per penjualan
  date: string;
  desc: string;
  createdBy?: string; // Nama akun pencatat (transaksi lama tidak punya)
  createdByEmail?: string;
}

export interface Settings {
  hargaLuring: number;
  hargaShopee: number;
  hppPerPorsi: number;
  komisiShopee: number; // Persentase komisi platform (misal: 30)
  tanggalSiklus: number;
}
