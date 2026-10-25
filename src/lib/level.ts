import type { PorsiPerLevel } from "@/interface/types";

export const LEVEL = ["1", "2", "3", "4", "5"] as const;

// Jumlah porsi semua level dalam satu pesanan
export function totalPorsi(levels: PorsiPerLevel) {
  return LEVEL.reduce((s, l) => s + (levels[l] ?? 0), 0);
}

// Hanya level yang ada porsinya yang disimpan ke Firestore
export function bersihkanLevel(levels: PorsiPerLevel): PorsiPerLevel {
  const hasil: PorsiPerLevel = {};
  for (const l of LEVEL) if ((levels[l] ?? 0) > 0) hasil[l] = levels[l];
  return hasil;
}

// "L2×2, L5×1"
export function teksLevel(levels: PorsiPerLevel | undefined) {
  if (!levels) return "";
  return LEVEL.filter((l) => (levels[l] ?? 0) > 0)
    .map((l) => `L${l}×${levels[l]}`)
    .join(", ");
}
