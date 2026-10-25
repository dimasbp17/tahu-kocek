import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Settings } from "@/interface/types";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { auth, keluar } from "@/firebase";

// Satu baris setelan: judul & penjelasan di kiri, isian di kanan (desktop)
function Baris({
  judul,
  deskripsi,
  children,
}: {
  judul: string;
  deskripsi: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-4 p-5 md:grid-cols-3 md:gap-8">
      <div>
        <h3 className="text-sm font-semibold text-zinc-900">{judul}</h3>
        <p className="mt-0.5 text-xs text-zinc-500">{deskripsi}</p>
      </div>
      <div className="md:col-span-2">{children}</div>
    </div>
  );
}

// Isian angka dengan awalan (Rp) atau akhiran (%)
function InputAngka({
  id,
  label,
  value,
  onChange,
  awalan,
  akhiran,
  min,
  max,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  awalan?: string;
  akhiran?: string;
  min?: number;
  max?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-zinc-600">
        {label}
      </Label>
      <div className="relative">
        {awalan && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
            {awalan}
          </span>
        )}
        <Input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value}
          onChange={onChange}
          className={`h-10 font-medium tabular-nums ${awalan ? "pl-10" : ""} ${akhiran ? "pr-8" : ""}`}
        />
        {akhiran && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
            {akhiran}
          </span>
        )}
      </div>
    </div>
  );
}

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
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 md:hidden">
          Setelan
        </h2>
        <p className="text-sm text-zinc-500">
          Harga, komisi, dan modal berlaku untuk semua perangkat.
        </p>
      </div>

      {!setelanTersimpan && (
        <p className="text-xs text-amber-800 bg-amber-50 ring-1 ring-amber-200 rounded-xl p-4">
          Setelan ini masih tersimpan di perangkat ini saja. Cek angkanya, lalu
          tekan Simpan supaya dipakai di semua perangkat.
        </p>
      )}

      <section className="rounded-xl bg-white ring-1 ring-zinc-900/10 divide-y overflow-hidden">
        <Baris
          judul="Harga jual"
          deskripsi="Harga per porsi yang dibayar pembeli."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <InputAngka
              id="hargaLuring"
              label="Langsung"
              awalan="Rp"
              min={1}
              value={form.hargaLuring}
              onChange={ubah("hargaLuring")}
            />
            <InputAngka
              id="hargaShopee"
              label="Shopee Food"
              awalan="Rp"
              min={1}
              value={form.hargaShopee}
              onChange={ubah("hargaShopee")}
            />
          </div>
        </Baris>

        <Baris
          judul="Komisi Shopee Food"
          deskripsi="Potongan platform dari harga jual. Cek di akun merchant-mu."
        >
          <div className="sm:max-w-[calc(50%-0.5rem)]">
            <InputAngka
              id="komisiShopee"
              label="Persentase komisi"
              akhiran="%"
              min={0}
              max={100}
              value={form.komisiShopee}
              onChange={ubah("komisiShopee")}
            />
          </div>
        </Baris>

        <Baris
          judul="Modal per porsi (HPP)"
          deskripsi="Dipakai untuk menghitung estimasi laba setiap penjualan."
        >
          <div className="sm:max-w-[calc(50%-0.5rem)]">
            <InputAngka
              id="hppPerPorsi"
              label="HPP per porsi"
              awalan="Rp"
              min={0}
              value={form.hppPerPorsi}
              onChange={ubah("hppPerPorsi")}
            />
          </div>
        </Baris>

        <div className="flex items-center justify-end gap-3 bg-zinc-50 px-5 py-3">
          {!berubah && (
            <span className="text-xs text-zinc-500">Tidak ada perubahan</span>
          )}
          <Button
            onClick={simpan}
            disabled={!berubah}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Simpan Setelan
          </Button>
        </div>
      </section>

      <section className="rounded-xl bg-white ring-1 ring-zinc-900/10">
        <Baris
          judul="Akun"
          deskripsi="Akun Google yang sedang dipakai di perangkat ini."
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-zinc-900 truncate">
              {auth.currentUser?.email}
            </p>
            <Button variant="outline" onClick={keluar}>
              Keluar
            </Button>
          </div>
        </Baris>
      </section>
    </div>
  );
}
