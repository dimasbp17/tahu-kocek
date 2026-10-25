import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";
import { dataPencatat, db, tulisOffline } from "@/firebase";
import InputAngka from "./input-angka";
import PilihanSegmen from "./pilihan-segmen";

interface Props {
  onSuccess: () => void;
}

export default function PengeluaranTab({ onSuccess }: Props) {
  const [tipeKeluar, setTipeKeluar] = useState<"belanja" | "tarik">("belanja");
  const [nominal, setNominal] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [saving, setSaving] = useState(false);

  const simpanPengeluaran = () => {
    // Cegah transaksi dobel saat tombol ditekan berkali-kali
    if (saving) return;
    if (!nominal || !keterangan) {
      toast.error("Isi nominal dan keterangan dulu ya!");
      return;
    }
    const jumlah = Number(nominal);
    if (!Number.isInteger(jumlah) || jumlah <= 0) {
      toast.error("Nominal harus angka bulat lebih dari 0");
      return;
    }

    setSaving(true);
    try {
      const online = tulisOffline(
        addDoc(collection(db, "transaksi"), {
          type: "OUT",
          category: tipeKeluar, // Menandai apakah ini belanja modal atau tarik laba
          amount: jumlah,
          date: new Date().toISOString(),
          ...dataPencatat(),
          desc:
            tipeKeluar === "tarik" ? `[Tarik Laba] ${keterangan}` : keterangan,
        }),
        "Gagal menyimpan pengeluaran",
      );

      setNominal("");
      setKeterangan("");
      toast.success(
        !online
          ? "Disimpan offline, dikirim saat online"
          : tipeKeluar === "tarik"
            ? "Berhasil tarik laba!"
            : "Modal belanja dicatat!",
      );
      onSuccess();
    } catch (e) {
      toast.error("Gagal menyimpan: " + e);
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 md:hidden">
          Catat Pengeluaran
        </h2>
        <p className="text-sm text-zinc-500">
          Belanja bahan mengurangi laba. Tarik laba hanya mengurangi arus kas.
        </p>
      </div>

      <section className="rounded-xl bg-white ring-1 ring-zinc-900/10 divide-y overflow-hidden">
        <div className="space-y-2 p-5">
          <Label className="text-xs font-medium text-zinc-600">
            Jenis pengeluaran
          </Label>
          <PilihanSegmen
            pilihan={[
              { id: "belanja", label: "Belanja Bahan" },
              { id: "tarik", label: "Tarik Laba" },
            ]}
            nilai={tipeKeluar}
            onPilih={setTipeKeluar}
          />
        </div>

        <div className="space-y-4 p-5">
          <InputAngka
            id="nominal"
            label="Nominal"
            awalan="Rp"
            min={1}
            value={nominal}
            onChange={(e) => setNominal(e.target.value)}
            placeholder="50000"
          />
          <div className="space-y-1.5">
            <Label
              htmlFor="keterangan"
              className="text-xs font-medium text-zinc-600"
            >
              Keterangan
            </Label>
            <Input
              id="keterangan"
              type="text"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder={
                tipeKeluar === "tarik"
                  ? "Contoh: Setor ke Kantong Jago"
                  : "Contoh: Beli cabai & gas"
              }
              className="h-10"
            />
          </div>
        </div>

        <div className="flex justify-end bg-zinc-50 px-5 py-3">
          <Button
            onClick={simpanPengeluaran}
            disabled={saving}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700"
          >
            {saving
              ? "Menyimpan..."
              : tipeKeluar === "tarik"
                ? "Simpan Tarik Laba"
                : "Simpan Belanja"}
          </Button>
        </div>
      </section>
    </div>
  );
}
