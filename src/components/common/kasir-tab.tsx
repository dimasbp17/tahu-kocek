import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Minus, Plus } from "lucide-react";
import toast from "react-hot-toast";
import type { Settings } from "@/interface/types";
import { dataPencatat, db, tulisOffline } from "@/firebase";
import { rupiah } from "@/lib/format";
import InputAngka from "./input-angka";
import PilihanSegmen from "./pilihan-segmen";
import {
  cekVoucher,
  deskripsiPesanan,
  hitungPesanan,
  type SumberPesanan,
} from "@/lib/hitung";

interface Props {
  settings: Settings;
  onSuccess: () => void; // Fungsi untuk pindah ke tab dashboard jika sukses
}

export default function KasirTab({ settings, onSuccess }: Props) {
  const [qty, setQty] = useState(1);
  const [tipePesanan, setTipePesanan] = useState<SumberPesanan>("luring");
  const [potonganVoucher, setPotonganVoucher] = useState("");
  const [saving, setSaving] = useState(false);

  const simpanPesanan = () => {
    // Cegah transaksi dobel saat tombol ditekan berkali-kali
    if (saving) return;
    const errorVoucher = cekVoucher(diskonPratinjau, hargaJual);
    if (errorVoucher) {
      toast.error(errorVoucher);
      return;
    }
    setSaving(true);
    try {
      const online = tulisOffline(
        addDoc(collection(db, "transaksi"), {
          type: "IN",
          source: tipePesanan,
          qty: qty,
          amount: totalHarga,
          discount: diskonPratinjau,
          netProfit: labaBersihPratinjau, // Simpan untung bersih ke Firebase
          date: new Date().toISOString(),
          ...dataPencatat(),
          desc: deskripsiPesanan(tipePesanan, qty, diskonPratinjau),
        }),
        "Gagal menyimpan pesanan",
      );
      setQty(1);
      setPotonganVoucher("");
      toast.success(
        online
          ? "Berhasil menyimpan pesanan"
          : "Pesanan disimpan offline, dikirim saat online",
      );
      onSuccess();
    } catch (e) {
      toast.error("Gagal menyimpan: " + e);
      setSaving(false);
    }
  };

  const {
    hargaJual,
    komisi: komisiShopee,
    diskon: diskonPratinjau,
    diterima: totalHarga,
    laba: labaBersihPratinjau,
  } = hitungPesanan(
    settings,
    tipePesanan,
    qty,
    potonganVoucher ? Number(potonganVoucher) : 0,
  );

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 md:hidden">
          Catat Penjualan
        </h2>
        <p className="text-sm text-zinc-500">
          Harga diambil dari Setelan. Pesanan tersimpan atas nama akunmu.
        </p>
      </div>

      <section className="rounded-xl bg-white ring-1 ring-zinc-900/10 divide-y overflow-hidden">
        <div className="space-y-2 p-5">
          <Label className="text-xs font-medium text-zinc-600">
            Sumber pesanan
          </Label>
          <PilihanSegmen
            pilihan={[
              { id: "luring", label: "Langsung" },
              { id: "shopee", label: "Shopee Food" },
            ]}
            nilai={tipePesanan}
            onPilih={setTipePesanan}
          />
        </div>

        <div className="space-y-2 p-5">
          <Label className="text-xs font-medium text-zinc-600">
            Jumlah porsi
          </Label>
          <div className="flex items-center justify-between gap-3 rounded-lg ring-1 ring-zinc-900/10 p-1.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setQty(Math.max(1, qty - 1))}
              aria-label="Kurangi porsi"
              className="h-11 w-11 text-zinc-600"
            >
              <Minus />
            </Button>
            <span className="text-3xl font-semibold text-zinc-900 tabular-nums">
              {qty}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setQty(qty + 1)}
              aria-label="Tambah porsi"
              className="h-11 w-11 text-zinc-600"
            >
              <Plus />
            </Button>
          </div>
        </div>

        {tipePesanan === "shopee" && (
          <div className="p-5">
            <InputAngka
              id="voucher"
              label="Potongan voucher"
              awalan="Rp"
              min={0}
              value={potonganVoucher}
              onChange={(e) => setPotonganVoucher(e.target.value)}
              placeholder="0"
            />
          </div>
        )}

        <dl className="space-y-2 bg-zinc-50 p-5 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-zinc-500">Harga jual</dt>
            <dd className="text-zinc-900 tabular-nums">{rupiah(hargaJual)}</dd>
          </div>
          {komisiShopee > 0 && (
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">
                Komisi Shopee ({settings.komisiShopee}%)
              </dt>
              <dd className="text-zinc-900 tabular-nums">
                −{rupiah(komisiShopee)}
              </dd>
            </div>
          )}
          {diskonPratinjau > 0 && (
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">Potongan voucher</dt>
              <dd className="text-zinc-900 tabular-nums">
                −{rupiah(diskonPratinjau)}
              </dd>
            </div>
          )}
          <div className="flex justify-between gap-3 border-t pt-2">
            <dt className="font-medium text-zinc-900">Yang diterima</dt>
            <dd className="text-base font-semibold text-zinc-900 tabular-nums">
              {rupiah(totalHarga)}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-zinc-500">Estimasi laba</dt>
            <dd
              className={`font-medium tabular-nums ${labaBersihPratinjau < 0 ? "text-[#d03b3b]" : "text-[#006300]"}`}
            >
              {rupiah(labaBersihPratinjau)}
            </dd>
          </div>
        </dl>

        <div className="flex justify-end px-5 py-3">
          <Button
            onClick={simpanPesanan}
            disabled={saving}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700"
          >
            {saving ? "Menyimpan..." : "Simpan Penjualan"}
          </Button>
        </div>
      </section>
    </div>
  );
}
