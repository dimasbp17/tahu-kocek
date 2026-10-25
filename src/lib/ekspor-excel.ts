import type { Transaction } from "@/interface/types";
import type { Ringkasan } from "@/lib/ringkasan";
import { LEVEL, teksLevel } from "@/lib/level";
import { labelMetode } from "@/lib/kas";

// Library Excel membaca Date sebagai UTC, jadi digeser supaya jam di Excel sama dengan jam lokal (WIB)
function jamLokal(iso: string) {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
}

function tanggalFile(d: Date) {
  const dua = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${dua(d.getMonth() + 1)}-${dua(d.getDate())}`;
}

export async function eksporExcel(
  transaksi: Transaction[],
  ringkasan: Ringkasan,
  periode: { id: string; label: string },
) {
  // Dimuat saat dibutuhkan saja supaya tidak menambah beban saat aplikasi dibuka
  const { default: writeExcelFile } = await import("write-excel-file/browser");

  const judul = (value: string) => ({ value, fontWeight: "bold" as const });
  const rupiah = (value: number) => ({ value, format: "#,##0" });

  const urut = [...transaksi].sort((a, b) => a.date.localeCompare(b.date));

  const dataTransaksi = [
    [
      "Tanggal",
      "Jenis",
      "Sumber",
      "Pembayaran",
      "Keterangan",
      "Porsi",
      "Level",
      "Voucher",
      "Nominal",
      "Estimasi Laba",
      "Dicatat oleh",
    ].map(judul),
    ...urut.map((t) => [
      { value: jamLokal(t.date), format: "dd/mm/yyyy hh:mm" },
      t.type === "IN"
        ? "Penjualan"
        : t.category === "tarik"
          ? "Tarik Laba"
          : "Belanja Bahan",
      t.type === "IN"
        ? t.source === "shopee"
          ? "Shopee Food"
          : "Langsung"
        : "",
      labelMetode(t),
      t.desc,
      t.qty ?? null,
      teksLevel(t.levels),
      t.discount ? rupiah(t.discount) : null,
      rupiah(t.amount),
      t.netProfit !== undefined ? rupiah(t.netProfit) : null,
      t.createdBy ?? "",
    ]),
  ];

  const dataRingkasan = [
    [judul("Periode"), periode.label],
    [judul("Pendapatan"), rupiah(ringkasan.omset)],
    [judul("Belanja Bahan"), rupiah(ringkasan.belanja)],
    [judul("Laba Bersih Real"), rupiah(ringkasan.labaReal)],
    [judul("Estimasi Laba"), rupiah(ringkasan.laba)],
    [judul("Tarik Laba"), rupiah(ringkasan.tarik)],
    [judul("Porsi Terjual"), ringkasan.porsi],
    ...LEVEL.map((l) => [
      judul(`Porsi Level ${l}`),
      ringkasan.porsiPerLevel[l],
    ]),
    [judul("Porsi Tanpa Level"), ringkasan.porsiTanpaLevel],
    [judul("Jumlah Transaksi"), transaksi.length],
    [
      judul("Diekspor"),
      { value: jamLokal(new Date().toISOString()), format: "dd/mm/yyyy hh:mm" },
    ],
  ];

  await writeExcelFile([
    {
      data: dataRingkasan,
      sheet: "Ringkasan",
      columns: [{ width: 20 }, { width: 18 }],
    },
    {
      data: dataTransaksi,
      sheet: "Transaksi",
      columns: [
        { width: 17 },
        { width: 14 },
        { width: 12 },
        { width: 14 },
        { width: 40 },
        { width: 7 },
        { width: 16 },
        { width: 10 },
        { width: 12 },
        { width: 14 },
        { width: 16 },
      ],
      stickyRowsCount: 1,
    },
  ]).toFile(`tahu-kocek-${periode.id}-${tanggalFile(new Date())}.xlsx`);
}
