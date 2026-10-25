import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { persenPerubahan } from "@/lib/format";

interface PerubahanProps {
  kini: number;
  lalu: number;
  naikItuBaik?: boolean; // false untuk biaya: naik = buruk
}

// Perubahan dari periode sebelumnya: ikon panah + persen, warna hanya penegas
export function Perubahan({ kini, lalu, naikItuBaik = true }: PerubahanProps) {
  const persen = persenPerubahan(kini, lalu);

  if (persen === null || Math.round(persen) === 0) {
    return (
      <span className="flex items-center gap-1 text-zinc-500">
        <Minus size={12} />
        {persen === null ? "Belum ada pembanding" : "Sama"}
      </span>
    );
  }

  const naik = persen > 0;
  const baik = naik === naikItuBaik;
  const Ikon = naik ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={`flex items-center gap-0.5 font-medium ${baik ? "text-[#006300]" : "text-[#d03b3b]"}`}
    >
      <Ikon size={14} />
      {naik ? "Naik" : "Turun"}{" "}
      {Math.abs(Math.round(persen)).toLocaleString("id-ID")}%
    </span>
  );
}

interface Props {
  label: string;
  nilai: string;
  kini: number;
  lalu: number;
  pembanding: string;
  naikItuBaik?: boolean;
}

// Kartu angka: label, nilai, dan perubahan dari periode sebelumnya
export default function StatTile({
  label,
  nilai,
  kini,
  lalu,
  pembanding,
  naikItuBaik = true,
}: Props) {
  return (
    <div className="rounded-xl bg-white ring-1 ring-zinc-900/10 p-4">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-zinc-900 truncate">
        {nilai}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs">
        <Perubahan kini={kini} lalu={lalu} naikItuBaik={naikItuBaik} />
        {lalu !== 0 && <span className="text-zinc-500">vs {pembanding}</span>}
      </div>
    </div>
  );
}
