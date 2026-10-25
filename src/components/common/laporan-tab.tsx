import { useState, useMemo } from "react";
import { deleteDoc, doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Trash2, ShoppingBag, TrendingUp, TrendingDown } from "lucide-react";
import toast from "react-hot-toast";
import type { Transaction } from "@/interface/types";
import { db, tulisOffline } from "@/firebase";

interface Props {
  transactions: Transaction[];
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

export default function LaporanTab({ transactions }: Props) {
  const [period, setPeriod] = useState<FilterPeriod>("hari");
  const [hapusId, setHapusId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const start = getStartDate(period);
    if (!start) return transactions;
    return transactions.filter((t) => new Date(t.date) >= start);
  }, [transactions, period]);

  const summary = useMemo(() => {
    const omset = filtered
      .filter((t) => t.type === "IN")
      .reduce((sum, t) => sum + t.amount, 0);
    const laba = filtered
      .filter((t) => t.type === "IN")
      .reduce((sum, t) => sum + (t.netProfit || 0), 0);
    // Tarik laba bukan biaya, jadi dipisah dari belanja bahan
    const belanja = filtered
      .filter((t) => t.type === "OUT" && t.category !== "tarik")
      .reduce((sum, t) => sum + t.amount, 0);
    const tarik = filtered
      .filter((t) => t.type === "OUT" && t.category === "tarik")
      .reduce((sum, t) => sum + t.amount, 0);
    const porsi = filtered
      .filter((t) => t.type === "IN")
      .reduce((sum, t) => sum + (t.qty || 0), 0);
    const labaReal = omset - belanja;
    return { omset, laba, belanja, tarik, porsi, labaReal };
  }, [filtered]);

  const konfirmasiHapus = () => {
    if (!hapusId) return;
    tulisOffline(deleteDoc(doc(db, "transaksi", hapusId)), "Gagal menghapus");
    toast.success("Berhasil dihapus");
    setHapusId(null);
  };

  const periods: { id: FilterPeriod; label: string }[] = [
    { id: "hari", label: "Hari Ini" },
    { id: "minggu", label: "7 Hari" },
    { id: "bulan", label: "Bulan Ini" },
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

      {/* Filter */}
      <div className="flex gap-2 md:max-w-md">
        {periods.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
              period === p.id
                ? "bg-blue-600 text-white"
                : "bg-white text-zinc-500 border hover:bg-zinc-50"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-2 lg:space-y-0">
        {/* Ringkasan Baris 1 */}
        <div className="grid grid-cols-2 gap-2">
          <Card className="bg-emerald-50 border-emerald-100 shadow-sm">
            <CardContent>
              <div className="flex items-center gap-1 text-emerald-700 mb-1">
                <ShoppingBag size={12} />
                <span className="text-[10px] font-bold uppercase">
                  Pendapatan
                </span>
              </div>
              <p className="text-sm font-bold text-emerald-900">
                Rp {summary.omset.toLocaleString("id-ID")}
              </p>
              <p className="text-[10px] text-emerald-600 mt-0.5">
                {summary.porsi} porsi
              </p>
            </CardContent>
          </Card>

          <Card className="bg-rose-50 border-rose-100 shadow-sm">
            <CardContent>
              <div className="flex items-center gap-1 text-rose-700 mb-1">
                <TrendingDown size={12} />
                <span className="text-[10px] font-bold uppercase">
                  Belanja Bahan
                </span>
              </div>
              <p className="text-sm font-bold text-rose-900">
                Rp {summary.belanja.toLocaleString("id-ID")}
              </p>
              {summary.tarik > 0 && (
                <p className="text-[10px] text-rose-600 mt-0.5">
                  Tarik laba Rp {summary.tarik.toLocaleString("id-ID")}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Ringkasan Baris 2 */}
        <div className="grid grid-cols-2 gap-2">
          <Card className="bg-amber-50 border-amber-100 shadow-sm">
            <CardContent>
              <div className="flex items-center gap-1 text-amber-700 mb-1">
                <TrendingUp size={12} />
                <span className="text-[10px] font-bold uppercase">
                  Estimasi Laba
                </span>
              </div>
              <p className="text-sm font-bold text-amber-900">
                Rp {summary.laba.toLocaleString("id-ID")}
              </p>
              <p className="text-[10px] text-amber-600 mt-0.5">
                Pendapatan − HPP
              </p>
            </CardContent>
          </Card>

          <Card
            className={`shadow-sm ${summary.labaReal >= 0 ? "bg-blue-50 border-blue-100" : "bg-rose-50 border-rose-100"}`}
          >
            <CardContent>
              <div
                className={`flex items-center gap-1 mb-1 ${summary.labaReal >= 0 ? "text-blue-700" : "text-rose-700"}`}
              >
                <TrendingUp size={12} />
                <span className="text-[10px] font-bold uppercase">
                  Laba Bersih Real
                </span>
              </div>
              <p
                className={`text-sm font-bold ${summary.labaReal >= 0 ? "text-blue-900" : "text-rose-900"}`}
              >
                Rp {summary.labaReal.toLocaleString("id-ID")}
              </p>
              <p
                className={`text-[10px] mt-0.5 ${summary.labaReal >= 0 ? "text-blue-600" : "text-rose-600"}`}
              >
                Pendapatan − Belanja Bahan
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* List transaksi */}
      <div className="border-none bg-transparent shadow-none">
        <CardHeader className="mb-3">
          <CardTitle className="text-base">
            Riwayat{" "}
            <span className="text-zinc-400 font-normal text-sm">
              ({filtered.length} transaksi)
            </span>
          </CardTitle>
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
                  </p>
                  {t.type === "IN" && t.netProfit !== undefined && (
                    <p className="text-xs font-semibold text-emerald-600 mt-1 bg-emerald-50 inline-block px-2 py-1 rounded">
                      Untung Bersih: Rp {t.netProfit.toLocaleString("id-ID")}
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
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setHapusId(t.id)}
                    className="h-8 w-8 text-rose-500 hover:bg-rose-100 shrink-0"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
