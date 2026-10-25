export interface BagianKomposisi {
  nama: string;
  warna: string;
  nilai: number;
  keterangan?: string; // Info tambahan di bawah nama, misal jumlah porsi
}

interface Props {
  bagian: BagianKomposisi[];
  formatNilai: (n: number) => string;
}

// Satu batang horizontal yang dibagi per bagian (part-to-whole),
// nilainya selalu ditulis sebagai teks supaya tidak bergantung pada warna
export default function KomposisiBar({ bagian, formatNilai }: Props) {
  const total = bagian.reduce((s, b) => s + b.nilai, 0);

  if (total <= 0) {
    return (
      <p className="text-sm text-zinc-500 py-6 text-center">
        Belum ada penjualan di periode ini.
      </p>
    );
  }

  const persen = (n: number) =>
    `${Math.round((n / total) * 100).toLocaleString("id-ID")}%`;

  return (
    <div className="space-y-4">
      {/* Celah 2px antarbagian, ujung luar membulat */}
      <div className="flex h-3 gap-0.5 overflow-hidden rounded">
        {bagian
          .filter((b) => b.nilai > 0)
          .map((b) => (
            <div
              key={b.nama}
              title={`${b.nama}: ${formatNilai(b.nilai)} (${persen(b.nilai)})`}
              style={{
                width: `${(b.nilai / total) * 100}%`,
                background: b.warna,
              }}
            />
          ))}
      </div>

      <ul className="space-y-3">
        {bagian.map((b) => (
          <li key={b.nama} className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2 min-w-0">
              <span
                className="mt-1 h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ background: b.warna }}
              />
              <div className="min-w-0">
                <p className="text-sm text-zinc-900">{b.nama}</p>
                {b.keterangan && (
                  <p className="text-xs text-zinc-500">{b.keterangan}</p>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-semibold text-zinc-900 tabular-nums">
                {formatNilai(b.nilai)}
              </p>
              <p className="text-xs text-zinc-500 tabular-nums">
                {persen(b.nilai)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
