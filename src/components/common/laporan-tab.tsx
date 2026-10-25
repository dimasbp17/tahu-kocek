import { useState, useMemo } from "react";
import { deleteDoc, doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Download, LayoutGrid, Table2 } from "lucide-react";
import toast from "react-hot-toast";
import type { Settings, Transaction } from "@/interface/types";
import { db, tulisOffline } from "@/firebase";
import { eksporExcel } from "@/lib/ekspor-excel";
import { rupiah } from "@/lib/format";
import { hitungRingkasan } from "@/lib/ringkasan";
import EditTransaksiDialog from "./edit-transaksi-dialog";
import RiwayatTransaksi, { type TampilanRiwayat } from "./riwayat-transaksi";

interface Props {
  transactions: Transaction[];
  settings: Settings;
}

const KUNCI_TAMPILAN = "tahuKocekTampilanRiwayat";

// Tampilan riwayat diingat per perangkat; bawaannya tabel
function bacaTampilan(): TampilanRiwayat {
  try {
    if (localStorage.getItem(KUNCI_TAMPILAN) === "kartu") return "kartu";
  } catch {
    // localStorage bisa tidak tersedia; pakai bawaan
  }
  return "tabel";
}

type FilterPeriod = "hari" | "minggu" | "bulan" | "semua";

function getStartDate(period: FilterPeriod): Date | null {
  const now = new Date();
  if (period === "hari") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (period === "minggu") {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (period === "bulan") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return null;
}

export default function LaporanTab({ transactions, settings }: Props) {
  const [period, setPeriod] = useState<FilterPeriod>("hari");
  const [hapusId, setHapusId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [mengekspor, setMengekspor] = useState(false);
  const [tampilan, setTampilan] = useState<TampilanRiwayat>(bacaTampilan);

  const pilihTampilan = (t: TampilanRiwayat) => {
    setTampilan(t);
    try {
      localStorage.setItem(KUNCI_TAMPILAN, t);
    } catch {
      // Tidak masalah kalau gagal disimpan
    }
  };

  // Dicari dari data terbaru supaya dialog tertutup kalau transaksinya dihapus perangkat lain
  const transaksiEdit = transactions.find((t) => t.id === editId);

  const filtered = useMemo(() => {
    const start = getStartDate(period);
    if (!start) return transactions;
    return transactions.filter((t) => new Date(t.date) >= start);
  }, [transactions, period]);

  const summary = useMemo(() => hitungRingkasan(filtered), [filtered]);

  const konfirmasiHapus = () => {
    if (!hapusId) return;
    tulisOffline(deleteDoc(doc(db, "transaksi", hapusId)), "Gagal menghapus");
    toast.success("Berhasil dihapus");
    setHapusId(null);
  };

  const ekspor = async () => {
    if (filtered.length === 0) {
      toast.error("Tidak ada transaksi untuk diekspor");
      return;
    }
    setMengekspor(true);
    try {
      await eksporExcel(
        filtered,
        summary,
        periods.find((p) => p.id === period)!,
      );
    } catch (e) {
      toast.error("Gagal mengekspor: " + e);
    } finally {
      setMengekspor(false);
    }
  };

  const periods: { id: FilterPeriod; label: string }[] = [
    { id: "hari", label: "Hari ini" },
    { id: "minggu", label: "7 hari" },
    { id: "bulan", label: "Bulan ini" },
    { id: "semua", label: "Semua" },
  ];

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Dialog konfirmasi hapus */}
      <AlertDialog
        open={!!hapusId}
        onOpenChange={(open) => !open && setHapusId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Transaksi?</AlertDialogTitle>
            <AlertDialogDescription>
              Data yang dihapus tidak bisa dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={konfirmasiHapus}
              className="bg-rose-600 hover:bg-rose-700"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {transaksiEdit && (
        <EditTransaksiDialog
          key={transaksiEdit.id}
          transaksi={transaksiEdit}
          settings={settings}
          onClose={() => setEditId(null)}
        />
      )}

      <div>
        <h2 className="text-xl font-semibold text-zinc-900 md:hidden">
          Laporan
        </h2>
        <p className="text-sm text-zinc-500">
          Ringkasan dan riwayat semua transaksi
        </p>
      </div>

      {/* Filter */}
      <div className="inline-flex w-full md:w-auto rounded-lg bg-zinc-200/60 p-1">
        {periods.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={`flex-1 md:flex-none px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              period === p.id
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Ringkasan periode */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "Pendapatan",
            nilai: summary.omset,
            ket: `${summary.porsi.toLocaleString("id-ID")} porsi`,
          },
          {
            label: "Belanja bahan",
            nilai: summary.belanja,
            ket: summary.tarik > 0 ? `Tarik laba ${rupiah(summary.tarik)}` : "",
          },
          {
            label: "Estimasi laba",
            nilai: summary.laba,
            ket: "Pendapatan − HPP",
          },
          {
            label: "Laba bersih",
            nilai: summary.labaReal,
            ket: "Pendapatan − belanja bahan",
          },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-xl bg-white ring-1 ring-zinc-900/10 p-4"
          >
            <p className="text-xs font-medium text-zinc-500">{k.label}</p>
            <p className="mt-1 text-lg font-semibold text-zinc-900 truncate">
              {rupiah(k.nilai)}
            </p>
            {k.ket && <p className="mt-0.5 text-xs text-zinc-500">{k.ket}</p>}
          </div>
        ))}
      </div>

      {/* Riwayat transaksi */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-zinc-900">
            Riwayat{" "}
            <span className="text-sm font-normal text-zinc-400">
              ({filtered.length} transaksi)
            </span>
          </h3>
          <div className="flex items-center gap-2">
            <div
              className="inline-flex rounded-lg bg-zinc-200/60 p-1"
              role="group"
              aria-label="Tampilan riwayat"
            >
              {(
                [
                  { id: "tabel", label: "Tabel", Ikon: Table2 },
                  { id: "kartu", label: "Kartu", Ikon: LayoutGrid },
                ] as const
              ).map(({ id, label, Ikon }) => (
                <button
                  key={id}
                  onClick={() => pilihTampilan(id)}
                  aria-pressed={tampilan === id}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    tampilan === id
                      ? "bg-white text-zinc-900 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  <Ikon size={14} />
                  {label}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={ekspor}
              disabled={mengekspor}
              className="shrink-0"
            >
              <Download size={14} />
              {mengekspor ? "Menyiapkan..." : "Excel"}
            </Button>
          </div>
        </div>

        <RiwayatTransaksi
          transaksi={filtered}
          tampilan={tampilan}
          onEdit={setEditId}
          onHapus={setHapusId}
        />
      </div>
    </div>
  );
}
