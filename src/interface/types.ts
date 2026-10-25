// Jumlah porsi per level pedas, misal { "2": 2, "5": 1 }
export type PorsiPerLevel = Partial<
  Record<"1" | "2" | "3" | "4" | "5", number>
>;

// Cara bayar penjualan Langsung & sumber dana pengeluaran.
// Transaksi sebelum fitur ini tidak punya field ini dan dianggap tunai.
export type MetodeBayar = "tunai" | "nontunai";

export interface Transaction {
  category: string;
  id: string;
  type: "IN" | "OUT";
  source?: string;
  qty?: number;
  levels?: PorsiPerLevel; // Transaksi sebelum ada level tidak punya ini
  payment?: MetodeBayar; // Tidak dipakai untuk penjualan Shopee
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

// Catatan tutup kas satu hari; id dokumen = tanggal "YYYY-MM-DD"
export interface TutupKas {
  tanggal: string;
  modalAwal: number; // Uang kembalian di laci saat buka
  tunaiMasuk: number;
  tunaiKeluar: number;
  seharusnya: number;
  aktual: number; // Uang yang benar-benar dihitung di laci
  selisih: number; // aktual − seharusnya
  catatan: string;
  createdBy: string;
  createdByEmail: string;
  updatedAt: string;
}
