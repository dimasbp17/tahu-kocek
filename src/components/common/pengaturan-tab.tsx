import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Settings } from "@/interface/types";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { auth, keluar } from "@/firebase";

interface Props {
  settings: Settings;
  setelanTersimpan: boolean;
  simpanSettings: (s: Settings) => boolean;
}

type Field = "hargaLuring" | "hargaShopee" | "komisiShopee" | "hppPerPorsi";

export default function PengaturanTab({
  settings,
  setelanTersimpan,
  simpanSettings,
}: Props) {
  // Disimpan sebagai teks supaya kolom boleh kosong saat mengetik
  const [form, setForm] = useState<Record<Field, string>>({
    hargaLuring: String(settings.hargaLuring),
    hargaShopee: String(settings.hargaShopee),
    komisiShopee: String(settings.komisiShopee),
    hppPerPorsi: String(settings.hppPerPorsi),
  });

  const ubah = (field: Field) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [field]: e.target.value });

  const berubah =
    !setelanTersimpan ||
    (Object.keys(form) as Field[]).some((f) => form[f] !== String(settings[f]));

  const simpan = () => {
    const angka = (f: Field) => Number(form[f]);
    const bulat = (Object.keys(form) as Field[]).every(
      (f) => form[f].trim() !== "" && Number.isInteger(angka(f)),
    );
    if (!bulat) {
      toast.error("Semua kolom harus diisi angka bulat");
      return;
    }
    if (angka("hargaLuring") <= 0 || angka("hargaShopee") <= 0) {
      toast.error("Harga jual harus lebih dari 0");
      return;
    }
    if (angka("komisiShopee") < 0 || angka("komisiShopee") > 100) {
      toast.error("Komisi Shopee harus antara 0 dan 100%");
      return;
    }
    if (angka("hppPerPorsi") < 0) {
      toast.error("HPP tidak boleh minus");
      return;
    }

    const online = simpanSettings({
      ...settings,
      hargaLuring: angka("hargaLuring"),
      hargaShopee: angka("hargaShopee"),
      komisiShopee: angka("komisiShopee"),
      hppPerPorsi: angka("hppPerPorsi"),
    });
    toast.success(
      online
        ? "Setelan disimpan untuk semua perangkat"
        : "Setelan disimpan offline, dikirim saat online",
    );
  };

  return (
    <div className="space-y-4">
      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-300 shadow-md">
        <CardHeader>
          <CardTitle>Pengaturan Harga & Modal</CardTitle>
          <CardDescription>
            Sesuaikan harga jual dan modal per porsi. Berlaku untuk semua
            perangkat.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Harga Jual Langsung (Rp)</Label>
            <Input
              type="number"
              min={1}
              value={form.hargaLuring}
              onChange={ubah("hargaLuring")}
              className="h-12 font-semibold"
            />
          </div>
          <div className="space-y-3">
            <Label>Harga Shopee Food (Rp)</Label>
            <Input
              type="number"
              min={1}
              value={form.hargaShopee}
              onChange={ubah("hargaShopee")}
              className="h-12 font-semibold"
            />
          </div>
          <div className="space-y-3 p-4 bg-orange-50 rounded-lg border border-orange-100">
            <Label className="text-orange-800">Komisi Shopee Food (%)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={form.komisiShopee}
              onChange={ubah("komisiShopee")}
              className="h-12 font-semibold bg-white"
            />
            <p className="text-xs text-orange-600 font-medium mt-2">
              *Potongan platform Shopee Food dari harga jual. Cek di akun
              merchant-mu.
            </p>
          </div>
          <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <Label className="text-blue-800">
              Modal Baku per Porsi / HPP (Rp)
            </Label>
            <Input
              type="number"
              min={0}
              value={form.hppPerPorsi}
              onChange={ubah("hppPerPorsi")}
              className="h-12 font-semibold bg-white"
            />
            <p className="text-xs text-blue-600 font-medium mt-2">
              *Digunakan untuk menghitung keuntungan bersih per penjualan.
            </p>
          </div>

          {!setelanTersimpan && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3">
              Setelan ini masih tersimpan di perangkat ini saja. Cek angkanya,
              lalu tekan Simpan supaya dipakai di semua perangkat.
            </p>
          )}

          <Button
            onClick={simpan}
            disabled={!berubah}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {berubah ? "Simpan Setelan" : "Tidak ada perubahan"}
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-zinc-500">Masuk sebagai</p>
            <p className="text-sm font-semibold text-zinc-800 truncate">
              {auth.currentUser?.email}
            </p>
          </div>
          <Button variant="outline" onClick={keluar}>
            Keluar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
