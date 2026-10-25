import { ArrowDownLeft, ArrowUpRight, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Transaction } from "@/interface/types";
import { rupiah } from "@/lib/format";
import { teksLevel } from "@/lib/level";
import { labelMetode } from "@/lib/kas";

export type TampilanRiwayat = "tabel" | "kartu";

interface Props {
  transaksi: Transaction[];
  tampilan: TampilanRiwayat;
  onEdit: (id: string) => void;
  onHapus: (id: string) => void;
}

const PREFIX_TARIK = "[Tarik Laba] ";

// Jenis transaksi selalu ditulis sebagai teks; warna hanya penegas
function jenis(t: Transaction) {
  const bayar = labelMetode(t);
  const dan = (label: string) => (bayar ? `${label} · ${bayar}` : label);
  if (t.type === "IN") {
    return {
      label: t.source === "shopee" ? "Shopee Food" : dan("Langsung"),
      kelas: "bg-emerald-50 text-emerald-700",
    };
  }
  if (t.category === "tarik") {
    return { label: dan("Tarik laba"), kelas: "bg-amber-50 text-amber-800" };
  }
  return { label: dan("Belanja"), kelas: "bg-zinc-100 text-zinc-700" };
}

// Jenis sudah tampil di kolomnya sendiri, jadi awalan "[Tarik Laba]" tidak perlu diulang
const keterangan = (t: Transaction) =>
  t.desc.startsWith(PREFIX_TARIK) ? t.desc.slice(PREFIX_TARIK.length) : t.desc;

const waktu = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

function Nominal({ t }: { t: Transaction }) {
  const masuk = t.type === "IN";
  return (
    <span
      className={`font-semibold tabular-nums whitespace-nowrap ${masuk ? "text-emerald-700" : "text-zinc-900"}`}
    >
      {masuk ? "+" : "−"}
      {rupiah(t.amount)}
    </span>
  );
}

function Aksi({
  t,
  onEdit,
  onHapus,
}: {
  t: Transaction;
  onEdit: (id: string) => void;
  onHapus: (id: string) => void;
}) {
  return (
    <div className="flex justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onEdit(t.id)}
        title="Edit"
        aria-label={`Edit ${keterangan(t)}`}
        className="h-8 w-8 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
      >
        <Pencil size={15} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onHapus(t.id)}
        title="Hapus"
        aria-label={`Hapus ${keterangan(t)}`}
        className="h-8 w-8 text-zinc-500 hover:bg-rose-50 hover:text-rose-600"
      >
        <Trash2 size={15} />
      </Button>
    </div>
  );
}

export default function RiwayatTransaksi({
  transaksi,
  tampilan,
  onEdit,
  onHapus,
}: Props) {
  if (transaksi.length === 0) {
    return (
      <p className="rounded-xl bg-white ring-1 ring-zinc-900/10 p-8 text-center text-sm text-zinc-500">
        Belum ada transaksi di periode ini.
      </p>
    );
  }

  if (tampilan === "kartu") {
    return (
      <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {transaksi.map((t) => {
          const j = jenis(t);
          const masuk = t.type === "IN";
          return (
            <li
              key={t.id}
              className="flex gap-3 rounded-xl bg-white ring-1 ring-zinc-900/10 p-4"
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  masuk
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-zinc-100 text-zinc-600"
                }`}
              >
                {masuk ? (
                  <ArrowDownLeft size={16} />
                ) : (
                  <ArrowUpRight size={16} />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 text-sm font-medium text-zinc-900 truncate">
                    {keterangan(t)}
                  </p>
                  <Nominal t={t} />
                </div>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {waktu(t.date)}
                  {t.createdBy && ` · ${t.createdBy.split(" ")[0]}`}
                  {t.editedBy && " · diedit"}
                </p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span
                      className={`rounded-full px-2 py-0.5 font-medium ${j.kelas}`}
                    >
                      {j.label}
                    </span>
                    {t.levels && (
                      <span className="text-zinc-600 tabular-nums">
                        {teksLevel(t.levels)}
                      </span>
                    )}
                    {masuk && t.netProfit !== undefined && (
                      <span className="text-zinc-500">
                        Est. laba{" "}
                        <span className="font-medium text-zinc-900 tabular-nums">
                          {rupiah(t.netProfit)}
                        </span>
                      </span>
                    )}
                  </div>
                  <Aksi t={t} onEdit={onEdit} onHapus={onHapus} />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl bg-white ring-1 ring-zinc-900/10">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-sm">
          <thead className="bg-zinc-50 text-xs text-zinc-500">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Waktu</th>
              <th className="px-4 py-2.5 text-left font-medium">Keterangan</th>
              <th className="px-4 py-2.5 text-left font-medium">Jenis</th>
              <th className="px-4 py-2.5 text-right font-medium">Porsi</th>
              <th className="px-4 py-2.5 text-left font-medium">Level</th>
              <th className="px-4 py-2.5 text-right font-medium">Nominal</th>
              <th className="px-4 py-2.5 text-right font-medium">Est. laba</th>
              <th className="px-4 py-2.5 text-left font-medium">Pencatat</th>
              <th className="px-4 py-2.5">
                <span className="sr-only">Aksi</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {transaksi.map((t) => {
              const j = jenis(t);
              return (
                <tr key={t.id} className="hover:bg-zinc-50/70">
                  <td className="px-4 py-2.5 whitespace-nowrap text-zinc-500 tabular-nums">
                    {waktu(t.date)}
                  </td>
                  <td className="px-4 py-2.5 text-zinc-900 min-w-48 max-w-64">
                    <span className="line-clamp-1">{keterangan(t)}</span>
                    {t.editedBy && (
                      <span className="text-xs text-zinc-400">diedit</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${j.kelas}`}
                    >
                      {j.label}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-zinc-600 tabular-nums">
                    {t.qty ?? "–"}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-zinc-600 tabular-nums">
                    {teksLevel(t.levels) || "–"}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Nominal t={t} />
                  </td>
                  <td className="px-4 py-2.5 text-right text-zinc-600 tabular-nums whitespace-nowrap">
                    {t.type === "IN" && t.netProfit !== undefined
                      ? rupiah(t.netProfit)
                      : "–"}
                  </td>
                  <td className="px-4 py-2.5 text-zinc-600 whitespace-nowrap">
                    {t.createdBy?.split(" ")[0] ?? "–"}
                  </td>
                  <td className="px-2 py-1.5">
                    <Aksi t={t} onEdit={onEdit} onHapus={onHapus} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
