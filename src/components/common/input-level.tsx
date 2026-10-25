import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PorsiPerLevel } from "@/interface/types";
import { LEVEL, totalPorsi } from "@/lib/level";

interface Props {
  levels: PorsiPerLevel;
  onChange: (levels: PorsiPerLevel) => void;
}

// Jumlah porsi per level pedas; satu pesanan boleh campur beberapa level
export default function InputLevel({ levels, onChange }: Props) {
  const ubah = (l: (typeof LEVEL)[number], delta: number) =>
    onChange({ ...levels, [l]: Math.max(0, (levels[l] ?? 0) + delta) });

  return (
    <div className="space-y-2">
      <ul className="divide-y rounded-lg ring-1 ring-zinc-900/10">
        {LEVEL.map((l) => {
          const jumlah = levels[l] ?? 0;
          return (
            <li
              key={l}
              className="flex items-center justify-between gap-3 py-1.5 pl-4 pr-1.5"
            >
              <span
                className={`text-sm ${jumlah > 0 ? "font-medium text-zinc-900" : "text-zinc-600"}`}
              >
                Level {l}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => ubah(l, -1)}
                  disabled={jumlah === 0}
                  aria-label={`Kurangi level ${l}`}
                  className="h-10 w-10 text-zinc-600"
                >
                  <Minus size={16} />
                </Button>
                <span
                  className={`w-8 text-center text-lg font-semibold tabular-nums ${jumlah > 0 ? "text-zinc-900" : "text-zinc-300"}`}
                >
                  {jumlah}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => ubah(l, 1)}
                  aria-label={`Tambah level ${l}`}
                  className="h-10 w-10 text-zinc-600"
                >
                  <Plus size={16} />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="text-right text-xs text-zinc-500">
        Total{" "}
        <span className="font-semibold text-zinc-900 tabular-nums">
          {totalPorsi(levels)} porsi
        </span>
      </p>
    </div>
  );
}
