import { useEffect, useState } from "react";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";
import { CircleAlert, CircleCheck } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Transaction, TutupKas } from "@/interface/types";
import { dataPencatat, db, tulisOffline } from "@/firebase";
import { rupiah } from "@/lib/format";
import { awalTanggal, hitungKasTunai, kunciTanggal } from "@/lib/kas";
import InputAngka from "./input-angka";

interface Props {
  transactions: Transaction[];
}

const tanggalPanjang = (kunci: string) =>
  awalTanggal(kunci).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const tanggalPendek = (kunci: string) =>
  awalTanggal(kunci).toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

// Selisih selalu ditulis sebagai teks; warna hanya penegas
function StatusSelisih({ selisih }: { selisih: number }) {
  if (selisih === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-[#006300]">
        <CircleCheck size={13} /> Pas
      </span>
    );
  }
  const kurang = selisih < 0;
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${
        kurang ? "bg-rose-50 text-[#d03b3b]" : "bg-amber-50 text-amber-800"
      }`}
    >
      <CircleAlert size={13} />
      {kurang ? "Kurang" : "Lebih"} {rupiah(Math.abs(selisih))}
    </span>
  );
}

export default function TutupKasTab({ transactions }: Props) {
  const hariIni = kunciTanggal(new Date());
  const [tanggal, setTanggal] = useState(hariIni);
  const [riwayat, setRiwayat] = useState<TutupKas[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, "tutupKas"),
      orderBy("tanggal", "desc"),
      limit(60),
    );
    return onSnapshot(
      q,
      (snap) => setRiwayat(snap.docs.map((d) => d.data() as TutupKas)),
      (err) => toast.error("Gagal memuat riwayat tutup kas: " + err.message),
    );
  }, []);

  const tersimpan = riwayat.find((r) => r.tanggal === tanggal);
  // Kembalian awal diisi otomatis dari tutup kas terakhir sebelum tanggal ini
  const sebelumnya = riwayat.find((r) => r.tanggal < tanggal);

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 md:hidden">
          Tutup Kas
        </h2>
        <p className="text-sm text-zinc-500">
          Cocokkan uang tunai di laci dengan catatan penjualan & pengeluaran.
        </p>
      </div>

      {/* key: form diisi ulang saat tanggal atau data tersimpannya berubah */}
      <FormTutupKas
        key={`${tanggal}-${tersimpan?.updatedAt ?? "baru"}`}
        tanggal={tanggal}
        hariIni={hariIni}
        onGantiTanggal={setTanggal}
        transactions={transactions}
        tersimpan={tersimpan}
        modalAwalBawaan={sebelumnya?.modalAwal ?? 0}
      />

      <section className="space-y-3">
        <h3 className="text-base font-semibold text-zinc-900">
          Riwayat tutup kas
        </h3>
        {riwayat.length === 0 ? (
          <p className="rounded-xl bg-white ring-1 ring-zinc-900/10 p-8 text-center text-sm text-zinc-500">
            Belum ada tutup kas.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl bg-white ring-1 ring-zinc-900/10">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead className="bg-zinc-50 text-xs text-zinc-500">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium">
                      Tanggal
                    </th>
                    <th className="px-4 py-2.5 text-right font-medium">
                      Seharusnya
                    </th>
                    <th className="px-4 py-2.5 text-right font-medium">
                      Di laci
                    </th>
                    <th className="px-4 py-2.5 text-left font-medium">
                      Selisih
                    </th>
                    <th className="px-4 py-2.5 text-left font-medium">
                      Ditutup oleh
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {riwayat.map((r) => (
                    <tr
                      key={r.tanggal}
                      onClick={() => setTanggal(r.tanggal)}
                      className={`cursor-pointer hover:bg-zinc-50/70 ${r.tanggal === tanggal ? "bg-blue-50/50" : ""}`}
                    >
                      <td className="px-4 py-2.5 whitespace-nowrap text-zinc-900">
                        {tanggalPendek(r.tanggal)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-zinc-600 tabular-nums">
                        {rupiah(r.seharusnya)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-zinc-900 tabular-nums">
                        {rupiah(r.aktual)}
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusSelisih selisih={r.selisih} />
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-zinc-600">
                        {r.createdBy.split(" ")[0]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function FormTutupKas({
  tanggal,
  hariIni,
  onGantiTanggal,
  transactions,
  tersimpan,
  modalAwalBawaan,
}: {
  tanggal: string;
  hariIni: string;
  onGantiTanggal: (t: string) => void;
  transactions: Transaction[];
  tersimpan?: TutupKas;
  modalAwalBawaan: number;
}) {
  const [modalAwal, setModalAwal] = useState(
    String(tersimpan?.modalAwal ?? modalAwalBawaan),
  );
  const [aktual, setAktual] = useState(
    tersimpan ? String(tersimpan.aktual) : "",
  );
  const [catatan, setCatatan] = useState(tersimpan?.catatan ?? "");

  const kas = hitungKasTunai(transactions, tanggal);
  const modal = Number(modalAwal) || 0;
  const seharusnya = modal + kas.masuk - kas.keluar;
  const aktualAngka = Number(aktual);
  const sudahDiisi = aktual.trim() !== "" && Number.isInteger(aktualAngka);
  const selisih = aktualAngka - seharusnya;

  const simpan = () => {
    if (!Number.isInteger(Number(modalAwal)) || Number(modalAwal) < 0) {
      toast.error("Kembalian awal harus angka bulat, tidak boleh minus");
      return;
    }
    if (!sudahDiisi || aktualAngka < 0) {
      toast.error("Isi jumlah uang di laci dengan angka bulat");
      return;
    }
    const data: TutupKas = {
      tanggal,
      modalAwal: modal,
      tunaiMasuk: kas.masuk,
      tunaiKeluar: kas.keluar,
      seharusnya,
      aktual: aktualAngka,
      selisih,
      catatan: catatan.trim(),
      ...dataPencatat(),
      updatedAt: new Date().toISOString(),
    };
    const online = tulisOffline(
      setDoc(doc(db, "tutupKas", tanggal), data),
      "Gagal menyimpan tutup kas",
    );
    toast.success(online ? "Tutup kas disimpan" : "Tutup kas disimpan offline");
  };

  const baris = (label: string, nilai: string, ket?: string) => (
    <div className="flex justify-between gap-3">
      <dt className="text-zinc-500">
        {label}
        {ket && <span className="block text-xs text-zinc-400">{ket}</span>}
      </dt>
      <dd className="text-zinc-900 tabular-nums">{nilai}</dd>
    </div>
  );

  return (
    <section className="rounded-xl bg-white ring-1 ring-zinc-900/10 divide-y overflow-hidden md:max-w-xl">
      <div className="grid gap-4 p-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label
            htmlFor="tanggal"
            className="text-xs font-medium text-zinc-600"
          >
            Tanggal
          </Label>
          <Input
            id="tanggal"
            type="date"
            max={hariIni}
            value={tanggal}
            onChange={(e) => e.target.value && onGantiTanggal(e.target.value)}
            className="h-10"
          />
        </div>
        <InputAngka
          id="modalAwal"
          label="Kembalian awal di laci"
          awalan="Rp"
          min={0}
          value={modalAwal}
          onChange={(e) => setModalAwal(e.target.value)}
        />
      </div>

      <dl className="space-y-2 bg-zinc-50 p-5 text-sm">
        <p className="text-xs font-medium text-zinc-600 pb-1">
          {tanggalPanjang(tanggal)}
        </p>
        {baris("Kembalian awal", rupiah(modal))}
        {baris(
          "Penjualan tunai",
          `+${rupiah(kas.masuk)}`,
          `${kas.jumlahPenjualan} transaksi Langsung yang dibayar tunai`,
        )}
        {baris("Belanja tunai", `−${rupiah(kas.belanja)}`)}
        {baris("Tarik laba tunai", `−${rupiah(kas.tarik)}`)}
        <div className="flex justify-between gap-3 border-t pt-2">
          <dt className="font-medium text-zinc-900">Seharusnya di laci</dt>
          <dd className="text-base font-semibold text-zinc-900 tabular-nums">
            {rupiah(seharusnya)}
          </dd>
        </div>
        {tanggal === hariIni && (
          <p className="text-xs text-zinc-400">
            Angka ini terus berubah selama masih ada transaksi hari ini.
          </p>
        )}
      </dl>

      <div className="space-y-4 p-5">
        <InputAngka
          id="aktual"
          label="Uang di laci setelah dihitung"
          awalan="Rp"
          min={0}
          value={aktual}
          onChange={(e) => setAktual(e.target.value)}
          placeholder="0"
        />
        {sudahDiisi && (
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-zinc-500">Selisih</span>
            <StatusSelisih selisih={selisih} />
          </div>
        )}
        <div className="space-y-1.5">
          <Label
            htmlFor="catatan"
            className="text-xs font-medium text-zinc-600"
          >
            Catatan (opsional)
          </Label>
          <Input
            id="catatan"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Contoh: kembalian ke pembeli kurang Rp2.000"
            className="h-10"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 bg-zinc-50 px-5 py-3">
        {tersimpan && (
          <span className="mr-auto text-xs text-zinc-500">
            Sudah ditutup oleh {tersimpan.createdBy.split(" ")[0]}. Menyimpan
            lagi akan memperbarui.
          </span>
        )}
        <Button
          onClick={simpan}
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-700"
        >
          {tersimpan ? "Perbarui Tutup Kas" : "Simpan Tutup Kas"}
        </Button>
      </div>
    </section>
  );
}
