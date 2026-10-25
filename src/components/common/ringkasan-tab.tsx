import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import ColumnChart from "@/components/charts/column-chart";
import KomposisiBar from "@/components/charts/komposisi-bar";
import StatTile, { Perubahan } from "./stat-tile";
import type { Transaction } from "@/interface/types";
import { angkaRingkas, rupiah } from "@/lib/format";
import {
  bucketPeriode,
  PILIHAN_PERIODE,
  rentangPeriode,
  type Periode,
} from "@/lib/periode";
import { hitungRingkasan } from "@/lib/ringkasan";

interface Props {
  transactions: Transaction[];
  onJual: () => void;
  onModal: () => void;
  onLihatSemua: () => void;
}

// Warna seri grafik (sudah dicek aman untuk buta warna)
const WARNA = {
  pendapatan: "#2a78d6",
  belanja: "#eb6834",
  langsung: "#1baf7a",
  shopee: "#6250d6",
};

const KUNCI_PERIODE = "tahuKocekPeriodeRingkasan";

function bacaPeriode(): Periode {
  try {
    const p = localStorage.getItem(KUNCI_PERIODE);
    if (PILIHAN_PERIODE.some((x) => x.id === p)) return p as Periode;
  } catch {
    // localStorage bisa tidak tersedia; pakai bawaan
  }
  return "hari";
}

export default function RingkasanTab({
  transactions,
  onJual,
  onModal,
  onLihatSemua,
}: Props) {
  const [periode, setPeriode] = useState<Periode>(bacaPeriode);

  const pilihPeriode = (p: Periode) => {
    setPeriode(p);
    try {
      localStorage.setItem(KUNCI_PERIODE, p);
    } catch {
      // Tidak masalah kalau gagal disimpan
    }
  };

  const now = new Date();
  const info = PILIHAN_PERIODE.find((p) => p.id === periode)!;
  const rentang = rentangPeriode(periode, now);
  const kini = transactions.filter((t) => new Date(t.date) >= rentang.mulai);
  const lalu = transactions.filter((t) => {
    const d = new Date(t.date);
    return d >= rentang.mulaiLalu && d < rentang.akhirLalu;
  });
  const r = hitungRingkasan(kini);
  const rl = hitungRingkasan(lalu);

  const dataGrafik = bucketPeriode(periode, now).map((b) => {
    const s = hitungRingkasan(
      kini.filter((t) => {
        const d = new Date(t.date);
        return d >= b.mulai && d < b.akhir;
      }),
    );
    return {
      label: b.label,
      labelPanjang: b.labelPanjang,
      nilai: [s.omset, s.belanja],
    };
  });

  const terbaru = transactions.slice(0, 5);

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300">
      {/* Judul & aksi cepat */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Ringkasan</h2>
          <p className="text-sm text-zinc-500">
            {now.toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 md:flex">
          <Button onClick={onJual} className="bg-blue-600 hover:bg-blue-700">
            <Plus size={16} /> Catat Penjualan
          </Button>
          <Button variant="outline" onClick={onModal}>
            <Minus size={16} /> Catat Pengeluaran
          </Button>
        </div>
      </div>

      {/* Filter periode: berlaku untuk semua angka & grafik di bawahnya */}
      <div className="inline-flex w-full md:w-auto rounded-lg bg-zinc-200/60 p-1">
        {PILIHAN_PERIODE.map((p) => (
          <button
            key={p.id}
            onClick={() => pilihPeriode(p.id)}
            className={`flex-1 md:flex-none px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              periode === p.id
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:gap-4 lg:grid-cols-3">
        {/* Angka utama */}
        <div className="rounded-xl bg-white ring-1 ring-zinc-900/10 p-5">
          <p className="text-sm font-medium text-zinc-500">
            Laba bersih · {info.label.toLowerCase()}
          </p>
          <p className="mt-1 text-4xl font-semibold text-zinc-900 break-all">
            {rupiah(r.labaReal)}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs">
            <Perubahan kini={r.labaReal} lalu={rl.labaReal} />
            {rl.labaReal !== 0 && (
              <span className="text-zinc-500">vs {info.pembanding}</span>
            )}
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Pendapatan − belanja bahan
          </p>

          <dl className="mt-4 space-y-2 border-t pt-4 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">Tarik laba</dt>
              <dd className="font-medium text-zinc-900 tabular-nums">
                {rupiah(r.tarik)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">Arus kas</dt>
              <dd className="font-medium text-zinc-900 tabular-nums">
                {rupiah(r.arusKas)}
              </dd>
            </div>
          </dl>
          {r.omsetShopee > 0 && (
            <p className="mt-3 text-xs text-zinc-500">
              Termasuk {rupiah(r.omsetShopee)} dari Shopee Food yang masuk ke
              saldo merchant, bukan tunai.
            </p>
          )}
        </div>

        {/* Kartu angka */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:col-span-2">
          <StatTile
            label="Pendapatan"
            nilai={rupiah(r.omset)}
            kini={r.omset}
            lalu={rl.omset}
            pembanding={info.pembanding}
          />
          <StatTile
            label="Belanja bahan"
            nilai={rupiah(r.belanja)}
            kini={r.belanja}
            lalu={rl.belanja}
            pembanding={info.pembanding}
            naikItuBaik={false}
          />
          <StatTile
            label="Estimasi laba"
            nilai={rupiah(r.laba)}
            kini={r.laba}
            lalu={rl.laba}
            pembanding={info.pembanding}
          />
          <StatTile
            label="Porsi terjual"
            nilai={`${r.porsi.toLocaleString("id-ID")} porsi`}
            kini={r.porsi}
            lalu={rl.porsi}
            pembanding={info.pembanding}
          />
        </div>
      </div>

      <div className="grid gap-3 md:gap-4 lg:grid-cols-3">
        <section className="rounded-xl bg-white ring-1 ring-zinc-900/10 p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-zinc-900">
            Pendapatan & belanja
          </h3>
          <p className="text-xs text-zinc-500 mb-4">
            {periode === "hari"
              ? "Per jam, hari ini"
              : `Per hari, ${info.label.toLowerCase()}`}
          </p>
          <ColumnChart
            seri={[
              { nama: "Pendapatan", warna: WARNA.pendapatan },
              { nama: "Belanja bahan", warna: WARNA.belanja },
            ]}
            data={dataGrafik}
            formatNilai={rupiah}
            formatSumbu={angkaRingkas}
          />
        </section>

        <section className="rounded-xl bg-white ring-1 ring-zinc-900/10 p-5">
          <h3 className="text-sm font-semibold text-zinc-900">
            Sumber penjualan
          </h3>
          <p className="text-xs text-zinc-500 mb-4">
            Pendapatan {info.label.toLowerCase()}
          </p>
          <KomposisiBar
            bagian={[
              {
                nama: "Langsung",
                warna: WARNA.langsung,
                nilai: r.omsetLuring,
                keterangan: `${r.porsiLuring.toLocaleString("id-ID")} porsi`,
              },
              {
                nama: "Shopee Food",
                warna: WARNA.shopee,
                nilai: r.omsetShopee,
                keterangan: `${r.porsiShopee.toLocaleString("id-ID")} porsi`,
              },
            ]}
            formatNilai={rupiah}
          />
        </section>
      </div>

      {/* Transaksi terbaru */}
      <section className="rounded-xl bg-white ring-1 ring-zinc-900/10">
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <h3 className="text-sm font-semibold text-zinc-900">
            Transaksi terbaru
          </h3>
          <button
            onClick={onLihatSemua}
            className="text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            Lihat semua
          </button>
        </div>
        {terbaru.length === 0 ? (
          <p className="px-5 pb-5 pt-2 text-sm text-zinc-500">
            Belum ada transaksi.
          </p>
        ) : (
          <ul className="divide-y">
            {terbaru.map((t) => {
              const masuk = t.type === "IN";
              return (
                <li key={t.id} className="flex items-center gap-3 px-5 py-3">
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
                    <p className="text-sm text-zinc-900 truncate">{t.desc}</p>
                    <p className="text-xs text-zinc-500">
                      {new Date(t.date).toLocaleString("id-ID", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {t.createdBy && ` · ${t.createdBy.split(" ")[0]}`}
                    </p>
                  </div>
                  <p
                    className={`text-sm font-semibold tabular-nums whitespace-nowrap ${
                      masuk ? "text-emerald-700" : "text-zinc-900"
                    }`}
                  >
                    {masuk ? "+" : "−"}
                    {rupiah(t.amount)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
