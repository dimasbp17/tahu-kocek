import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Minus, Plus } from "lucide-react";
import toast from "react-hot-toast";
import type { Settings } from "@/interface/types";
import { dataPencatat, db, tulisOffline } from "@/firebase";

interface Props {
  settings: Settings;
  onSuccess: () => void; // Fungsi untuk pindah ke tab dashboard jika sukses
}

export default function KasirTab({ settings, onSuccess }: Props) {
  const [qty, setQty] = useState(1);
  const [tipePesanan, setTipePesanan] = useState("luring");
  const [potonganVoucher, setPotonganVoucher] = useState("");
  const [saving, setSaving] = useState(false);

  // const hargaPratinjau =
  //   tipePesanan === "luring" ? settings.hargaLuring : settings.hargaShopee;
  // const diskonPratinjau =
  //   tipePesanan === "shopee" && potonganVoucher ? parseInt(potonganVoucher) : 0;

  // const totalHarga = Math.max(0, qty * hargaPratinjau - diskonPratinjau);
  // const totalModalBaku = qty * (settings.hppPerPorsi || 0);
  // const labaBersihPratinjau = totalHarga - totalModalBaku;

  const simpanPesanan = () => {
    // Cegah transaksi dobel saat tombol ditekan berkali-kali
    if (saving) return;
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
          desc: `Pesanan ${tipePesanan === "luring" ? "Luring" : "Shopee"} (${qty} porsi)${diskonPratinjau > 0 ? ` - Diskon Rp${diskonPratinjau.toLocaleString("id-ID")}` : ""}`,
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

  const hargaPratinjau =
    tipePesanan === "luring" ? settings.hargaLuring : settings.hargaShopee;

  const komisiShopee =
    tipePesanan === "shopee"
      ? Math.round(hargaPratinjau * qty * (settings.komisiShopee / 100))
      : 0;

  const diskonPratinjau =
    tipePesanan === "shopee" && potonganVoucher ? parseInt(potonganVoucher) : 0;

  const totalHarga = Math.max(
    0,
    qty * hargaPratinjau - diskonPratinjau - komisiShopee,
  );
  const totalModalBaku = qty * (settings.hppPerPorsi || 0);
  const labaBersihPratinjau = totalHarga - totalModalBaku;

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-300 shadow-md">
      <CardHeader>
        <CardTitle>Pesanan Baru</CardTitle>
        <CardDescription>Catat penjualan masuk.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>Sumber Pesanan</Label>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={tipePesanan === "luring" ? "default" : "outline"}
              className={
                tipePesanan === "luring" ? "bg-blue-600 hover:bg-blue-700" : ""
              }
              onClick={() => setTipePesanan("luring")}
            >
              Langsung
            </Button>
            <Button
              variant={tipePesanan === "shopee" ? "default" : "outline"}
              className={
                tipePesanan === "shopee" ? "bg-blue-600 hover:bg-blue-700" : ""
              }
              onClick={() => setTipePesanan("shopee")}
            >
              Shopee Food
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <Label>Jumlah Porsi</Label>
          <div className="flex items-center justify-between p-1 bg-zinc-100 rounded-lg border">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setQty(Math.max(1, qty - 1))}
              className="h-12 w-12 text-zinc-600"
            >
              <Minus />
            </Button>
            <span className="text-3xl font-bold text-zinc-800">{qty}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setQty(qty + 1)}
              className="h-12 w-12 text-zinc-600"
            >
              <Plus />
            </Button>
          </div>
        </div>

        {tipePesanan === "shopee" && (
          <div className="space-y-3 bg-blue-50 p-4 rounded-lg border border-blue-100">
            <Label className="text-blue-800">Potongan Voucher (Rp)</Label>
            <Input
              type="number"
              value={potonganVoucher}
              onChange={(e) => setPotonganVoucher(e.target.value)}
              placeholder="Contoh: 3000"
              className="bg-white border-blue-200"
            />
          </div>
        )}

        {/* <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 mb-4">
          <p className="text-sm text-emerald-800 flex justify-between">
            Total Tagihan:{" "}
            <strong>Rp {totalHarga.toLocaleString("id-ID")}</strong>
          </p>
          <p className="text-sm text-emerald-800 flex justify-between mt-1">
            Estimasi Untung Bersih:{" "}
            <strong>Rp {labaBersihPratinjau.toLocaleString("id-ID")}</strong>
          </p>
        </div> */}

        <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 space-y-1">
          <p className="text-sm text-emerald-800 flex justify-between">
            <span>Harga Jual</span>
            <strong>Rp {(qty * hargaPratinjau).toLocaleString("id-ID")}</strong>
          </p>
          {komisiShopee > 0 && (
            <p className="text-sm text-rose-600 flex justify-between">
              <span>Komisi Shopee ({settings.komisiShopee}%)</span>
              <strong>- Rp {komisiShopee.toLocaleString("id-ID")}</strong>
            </p>
          )}
          {diskonPratinjau > 0 && (
            <p className="text-sm text-rose-600 flex justify-between">
              <span>Potongan Voucher</span>
              <strong>- Rp {diskonPratinjau.toLocaleString("id-ID")}</strong>
            </p>
          )}
          <div className="border-t border-emerald-200 pt-1 flex justify-between">
            <span className="text-sm text-emerald-800">Yang Diterima</span>
            <strong className="text-emerald-800">
              Rp {totalHarga.toLocaleString("id-ID")}
            </strong>
          </div>
          <p className="text-sm text-emerald-800 flex justify-between">
            <span>Estimasi Untung Bersih</span>
            <strong>Rp {labaBersihPratinjau.toLocaleString("id-ID")}</strong>
          </p>
        </div>

        <Button
          onClick={simpanPesanan}
          disabled={saving}
          className="w-full bg-emerald-600 hover:bg-emerald-700 shadow-md"
        >
          {saving ? "Menyimpan..." : "Simpan Transaksi"}
        </Button>
      </CardContent>
    </Card>
  );
}
