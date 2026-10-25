// Rp 1.250.000 (minus ditulis di depan: −Rp 5.000)
export function rupiah(n: number) {
  return `${n < 0 ? "−" : ""}Rp ${Math.abs(n).toLocaleString("id-ID")}`;
}

// Versi ringkas untuk sumbu grafik: 850 rb, 1,2 jt
export function angkaRingkas(n: number) {
  const abs = Math.abs(n);
  const tanda = n < 0 ? "−" : "";
  const fmt = (v: number) =>
    v.toLocaleString("id-ID", { maximumFractionDigits: 1 });
  if (abs >= 1_000_000) return `${tanda}${fmt(abs / 1_000_000)} jt`;
  if (abs >= 1_000) return `${tanda}${fmt(abs / 1_000)} rb`;
  return `${tanda}${abs}`;
}

// Persentase perubahan dari periode sebelumnya; null kalau tidak ada pembanding
export function persenPerubahan(kini: number, lalu: number) {
  if (lalu === 0) return null;
  return ((kini - lalu) / Math.abs(lalu)) * 100;
}
