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
import { signOut } from "firebase/auth";
import { auth } from "@/firebase";

interface Props {
  settings: Settings;
  setSettings: (s: Settings) => void;
}

export default function PengaturanTab({ settings, setSettings }: Props) {
  return (
    <div className="space-y-4">
      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-300 shadow-md">
        <CardHeader>
          <CardTitle>Pengaturan Harga & Modal</CardTitle>
          <CardDescription>
            Sesuaikan harga jual dan modal per porsi.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Harga Jual Langsung (Rp)</Label>
            <Input
              type="number"
              value={settings.hargaLuring}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  hargaLuring: parseInt(e.target.value) || 0,
                })
              }
              className="h-12 font-semibold"
            />
          </div>
          <div className="space-y-3">
            <Label>Harga Shopee Food (Rp)</Label>
            <Input
              type="number"
              value={settings.hargaShopee}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  hargaShopee: parseInt(e.target.value) || 0,
                })
              }
              className="h-12 font-semibold"
            />
          </div>
          <div className="space-y-3 p-4 bg-orange-50 rounded-lg border border-orange-100">
            <Label className="text-orange-800">Komisi Shopee Food (%)</Label>
            <Input
              type="number"
              value={settings.komisiShopee}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  komisiShopee: parseInt(e.target.value) || 0,
                })
              }
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
              value={settings.hppPerPorsi}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  hppPerPorsi: parseInt(e.target.value) || 0,
                })
              }
              className="h-12 font-semibold bg-white"
            />
            <p className="text-xs text-blue-600 font-medium mt-2">
              *Digunakan untuk menghitung keuntungan bersih per penjualan.
            </p>
          </div>
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
          <Button variant="outline" onClick={() => signOut(auth)}>
            Keluar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
