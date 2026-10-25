// Jumlah porsi per level pedas, misal { "2": 2, "5": 1 }
export type PorsiPerLevel = Partial<
  Record<"1" | "2" | "3" | "4" | "5", number>
>;

export interface Transaction {
  category: string;
  id: string;
  type: "IN" | "OUT";
  source?: string;
  qty?: number;
  levels?: PorsiPerLevel; // Transaksi sebelum ada level tidak punya ini
  amount: number;
  discount?: number;
  netProfit?: number; // Tambahan: Keuntungan bersih per penjualan
  date: string;
  desc: string;
  createdBy?: string; // Nama akun pencatat (transaksi lama tidak punya)
  createdByEmail?: string;
  editedBy?: string; // Nama akun yang terakhir mengedit
  editedByEmail?: string;
  editedAt?: string;
}

export interface Settings {
  hargaLuring: number;
  hargaShopee: number;
  hppPerPorsi: number;
  komisiShopee: number; // Persentase komisi platform (misal: 30)
  tanggalSiklus: number;
}
