import { useState, useMemo } from "react";
import { deleteDoc, doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
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
import { Download, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import type { Settings, Transaction } from "@/interface/types";
import { db, tulisOffline } from "@/firebase";
import { eksporExcel } from "@/lib/ekspor-excel";
import { rupiah } from "@/lib/format";
import { hitungRingkasan } from "@/lib/ringkasan";
import EditTransaksiDialog from "./edit-transaksi-dialog";

interface Props {
  transactions: Transaction[];
  settings: Settings;
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

      {/* List transaksi */}
      <div className="border-none bg-transparent shadow-none">
        <CardHeader className="mb-3 flex items-center justify-between gap-3">
          <CardTitle className="text-base">
            Riwayat{" "}
            <span className="text-zinc-400 font-normal text-sm">
              ({filtered.length} transaksi)
            </span>
          </CardTitle>
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
        </CardHeader>
        <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
          {filtered.length === 0 ? (
            <p className="text-zinc-500 text-center p-8 bg-white rounded-lg border border-dashed lg:col-span-2">
              Belum ada transaksi.
            </p>
          ) : (
            filtered.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-sm"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-zinc-900 truncate">
                    {t.desc}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {new Date(t.date).toLocaleString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "numeric",
                      month: "short",
                    })}
                    {t.createdBy && ` · oleh ${t.createdBy.split(" ")[0]}`}
                    {t.editedBy && " · diedit"}
                  </p>
                  {t.type === "IN" && t.netProfit !== undefined && (
                    <p className="text-xs font-semibold text-emerald-600 mt-1 bg-emerald-50 inline-block px-2 py-1 rounded">
                      Estimasi Laba: Rp {t.netProfit.toLocaleString("id-ID")}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 pl-3">
                  <div
                    className={`font-bold whitespace-nowrap ${t.type === "IN" ? "text-blue-600" : "text-rose-600"}`}
                  >
                    {t.type === "IN" ? "+" : "-"} Rp{" "}
                    {t.amount.toLocaleString("id-ID")}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditId(t.id)}
                      title="Edit"
                      aria-label="Edit transaksi"
                      className="h-8 w-8 text-zinc-500 hover:bg-zinc-100 shrink-0"
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setHapusId(t.id)}
                      title="Hapus"
                      aria-label="Hapus transaksi"
                      className="h-8 w-8 text-rose-500 hover:bg-rose-100 shrink-0"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
