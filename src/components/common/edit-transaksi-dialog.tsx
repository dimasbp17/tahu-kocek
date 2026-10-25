import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";
import type {
  MetodeBayar,
  PorsiPerLevel,
  Settings,
  Transaction,
} from "@/interface/types";
import { dataPencatat, db, tulisOffline } from "@/firebase";
import { bersihkanLevel, totalPorsi } from "@/lib/level";
import InputLevel from "./input-level";
import PilihanSegmen from "./pilihan-segmen";
import { metodeBayar } from "@/lib/kas";
import {
  cekVoucher,
  deskripsiPesanan,
  hitungPesanan,
  type SumberPesanan,
} from "@/lib/hitung";

interface Props {
  transaksi: Transaction;
  settings: Settings;
  onClose: () => void;
}

const PREFIX_TARIK = "[Tarik Laba] ";

export default function EditTransaksiDialog({
  transaksi,
  settings,
  onClose,
}: Props) {
  const penjualan = transaksi.type === "IN";

  // Isian penjualan
  const [sumber, setSumber] = useState<SumberPesanan>(
    transaksi.source === "shopee" ? "shopee" : "luring",
  );
  const [levels, setLevels] = useState<PorsiPerLevel>(transaksi.levels ?? {});
  const [bayar, setBayar] = useState<MetodeBayar>(metodeBayar(transaksi));
  const [voucher, setVoucher] = useState(
    transaksi.discount ? String(transaksi.discount) : "",
  );

  // Isian pengeluaran
  const [jenis, setJenis] = useState<"belanja" | "tarik">(
    transaksi.category === "tarik" ? "tarik" : "belanja",
  );
  const [nominal, setNominal] = useState(String(transaksi.amount));
  const [keterangan, setKeterangan] = useState(
    transaksi.desc.startsWith(PREFIX_TARIK)
      ? transaksi.desc.slice(PREFIX_TARIK.length)
      : transaksi.desc,
  );

  const qtyAngka = totalPorsi(levels);
  const rincian = hitungPesanan(
    settings,
    sumber,
    qtyAngka,
    voucher ? Number(voucher) : 0,
  );

  const simpan = () => {
    const { createdBy, createdByEmail } = dataPencatat();
    const jejakEdit = {
      editedBy: createdBy,
      editedByEmail: createdByEmail,
      editedAt: new Date().toISOString(),
    };

    let perubahan: Record<string, unknown>;
    if (penjualan) {
      if (qtyAngka === 0) {
        toast.error("Isi jumlah porsi di salah satu level dulu");
        return;
      }
      const errorVoucher = cekVoucher(rincian.diskon, rincian.hargaJual);
      if (errorVoucher) {
        toast.error(errorVoucher);
        return;
      }
      perubahan = {
        source: sumber,
        qty: qtyAngka,
        levels: bersihkanLevel(levels),
        ...(sumber === "luring" ? { payment: bayar } : {}),
        amount: rincian.diterima,
        discount: rincian.diskon,
        netProfit: rincian.laba,
        desc: deskripsiPesanan(sumber, qtyAngka, rincian.diskon, levels),
      };
    } else {
      const jumlah = Number(nominal);
      if (!Number.isInteger(jumlah) || jumlah <= 0) {
        toast.error("Nominal harus angka bulat lebih dari 0");
        return;
      }
      if (!keterangan.trim()) {
        toast.error("Keterangan tidak boleh kosong");
        return;
      }
      perubahan = {
        category: jenis,
        payment: bayar,
        amount: jumlah,
        desc: jenis === "tarik" ? PREFIX_TARIK + keterangan : keterangan,
      };
    }

    const online = tulisOffline(
      updateDoc(doc(db, "transaksi", transaksi.id), {
        ...perubahan,
        ...jejakEdit,
      }),
      "Gagal mengubah transaksi",
    );
    toast.success(
      online ? "Transaksi diperbarui" : "Perubahan disimpan offline",
    );
    onClose();
  };

  const pilihan = (aktif: boolean, warna: string) => ({
    variant: aktif ? ("default" as const) : ("outline" as const),
    className: aktif ? warna : "",
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Edit {penjualan ? "Penjualan" : "Pengeluaran"}
          </DialogTitle>
          <DialogDescription>
            Dicatat{" "}
            {new Date(transaksi.date).toLocaleString("id-ID", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
            {transaksi.createdBy && ` oleh ${transaksi.createdBy}`}
          </DialogDescription>
        </DialogHeader>

        {penjualan ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Sumber Pesanan</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  {...pilihan(
                    sumber === "luring",
                    "bg-blue-600 hover:bg-blue-700",
                  )}
                  onClick={() => setSumber("luring")}
                >
                  Langsung
                </Button>
                <Button
                  {...pilihan(
                    sumber === "shopee",
                    "bg-blue-600 hover:bg-blue-700",
                  )}
                  onClick={() => setSumber("shopee")}
                >
                  Shopee Food
                </Button>
              </div>
            </div>
            {sumber === "luring" && (
              <div className="space-y-2">
                <Label>Metode Bayar</Label>
                <PilihanSegmen
                  pilihan={[
                    { id: "tunai", label: "Tunai" },
                    { id: "nontunai", label: "QRIS" },
                  ]}
                  nilai={bayar}
                  onPilih={setBayar}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Jumlah Porsi per Level</Label>
              {!transaksi.levels && (
                <p className="text-xs text-amber-800 bg-amber-50 rounded-lg p-2">
                  Transaksi ini dicatat sebelum ada level ({transaksi.qty ?? 0}{" "}
                  porsi). Isi jumlah per level untuk menyimpan perubahan.
                </p>
              )}
              <InputLevel levels={levels} onChange={setLevels} />
            </div>
            {sumber === "shopee" && (
              <div className="space-y-2">
                <Label>Potongan Voucher (Rp)</Label>
                <Input
                  type="number"
                  min={0}
                  value={voucher}
                  onChange={(e) => setVoucher(e.target.value)}
                  placeholder="0"
                />
              </div>
            )}
            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 text-sm text-emerald-800 space-y-1">
              <p className="flex justify-between">
                <span>Yang Diterima</span>
                <strong>Rp {rincian.diterima.toLocaleString("id-ID")}</strong>
              </p>
              <p className="flex justify-between">
                <span>Estimasi Laba</span>
                <strong>Rp {rincian.laba.toLocaleString("id-ID")}</strong>
              </p>
            </div>
            <p className="text-xs text-zinc-500">
              Dihitung ulang dengan harga, komisi, dan HPP di Setelan saat ini.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Jenis Pengeluaran</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  {...pilihan(
                    jenis === "belanja",
                    "bg-rose-600 hover:bg-rose-700",
                  )}
                  onClick={() => setJenis("belanja")}
                >
                  Belanja Bahan
                </Button>
                <Button
                  {...pilihan(
                    jenis === "tarik",
                    "bg-amber-600 hover:bg-amber-700 text-white",
                  )}
                  onClick={() => setJenis("tarik")}
                >
                  Tarik Laba
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Dibayar dengan</Label>
              <PilihanSegmen
                pilihan={[
                  { id: "tunai", label: "Tunai dari laci" },
                  { id: "nontunai", label: "Transfer/QRIS" },
                ]}
                nilai={bayar}
                onPilih={setBayar}
              />
            </div>
            <div className="space-y-2">
              <Label>Nominal (Rp)</Label>
              <Input
                type="number"
                min={1}
                value={nominal}
                onChange={(e) => setNominal(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Keterangan</Label>
              <Input
                type="text"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button
            onClick={simpan}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Simpan Perubahan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
