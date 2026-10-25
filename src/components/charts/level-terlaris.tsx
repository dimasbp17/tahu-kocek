import { LEVEL } from "@/lib/level";

interface Props {
  porsiPerLevel: Record<(typeof LEVEL)[number], number>;
  porsiTanpaLevel: number;
}

// Sorot level terlaris, level lain jadi pembanding abu-abu
const WARNA_SOROT = "#2a78d6";
const WARNA_LAIN = "#c3c2b7";

export default function LevelTerlaris({
  porsiPerLevel,
  porsiTanpaLevel,
}: Props) {
  const total = LEVEL.reduce((s, l) => s + porsiPerLevel[l], 0);
  const catatanLama = porsiTanpaLevel > 0 && (
    <p className="text-xs text-zinc-500">
      {porsiTanpaLevel.toLocaleString("id-ID")} porsi lain dicatat sebelum ada
      level, jadi tidak dihitung di sini.
    </p>
  );

  if (total === 0) {
    return (
      <div className="space-y-2 py-4 text-center">
        <p className="text-sm text-zinc-500">
          Belum ada penjualan berlevel di periode ini.
        </p>
        {catatanLama}
      </div>
    );
  }

  const maks = Math.max(...LEVEL.map((l) => porsiPerLevel[l]));
  const terlaris = LEVEL.filter((l) => porsiPerLevel[l] === maks);
  const persen = (n: number) =>
    `${Math.round((n / total) * 100).toLocaleString("id-ID")}%`;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-2xl font-semibold text-zinc-900">
          Level {terlaris.join(" & ")}
        </p>
        <p className="text-xs text-zinc-500">
          {terlaris.length > 1
            ? "Sama laris, masing-masing "
            : "Paling laris, "}
          {maks.toLocaleString("id-ID")} porsi ({persen(maks)})
        </p>
      </div>

      <ul className="space-y-2.5">
        {LEVEL.map((l) => {
          const n = porsiPerLevel[l];
          const sorot = n === maks;
          return (
            <li key={l} className="flex items-center gap-3 text-sm">
              <span
                className={`w-14 shrink-0 ${sorot ? "font-medium text-zinc-900" : "text-zinc-600"}`}
              >
                Level {l}
              </span>
              <div className="h-2.5 flex-1">
                {n > 0 && (
                  <div
                    className="h-full rounded-r"
                    style={{
                      width: `${(n / maks) * 100}%`,
                      background: sorot ? WARNA_SOROT : WARNA_LAIN,
                    }}
                  />
                )}
              </div>
              <span className="w-20 shrink-0 text-right tabular-nums">
                <span className="font-medium text-zinc-900">
                  {n.toLocaleString("id-ID")}
                </span>{" "}
                <span className="text-xs text-zinc-500">{persen(n)}</span>
              </span>
            </li>
          );
        })}
      </ul>

      {catatanLama}
    </div>
  );
}
