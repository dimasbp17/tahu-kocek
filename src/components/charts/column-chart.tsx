import { useEffect, useRef, useState } from "react";

export interface Seri {
  nama: string;
  warna: string;
}

export interface Titik {
  label: string; // Label pendek di sumbu X
  labelPanjang: string; // Judul tooltip & tabel
  nilai: number[]; // Satu nilai per seri, urutannya sama dengan `seri`
}

interface Props {
  seri: Seri[];
  data: Titik[];
  formatNilai: (n: number) => string;
  formatSumbu: (n: number) => string;
  tinggi?: number;
}

// Warna kerangka grafik (garis bantu, sumbu, teks)
const GRID = "#e1e0d9";
const SUMBU = "#c3c2b7";
const TEKS_SUMBU = "#898781";
const SOROT = "#f4f4f1";

// Langkah sumbu Y yang bulat: 1, 2, 5 × 10^n
function langkahBulat(v: number) {
  const pangkat = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 2, 5, 10]) if (m * pangkat >= v) return m * pangkat;
  return 10 * pangkat;
}

// Batang dengan ujung atas membulat 4px dan dasar persegi
function pathBatang(x: number, yAtas: number, w: number, h: number) {
  const r = Math.min(4, w / 2, h);
  return `M${x},${yAtas + h}V${yAtas + r}Q${x},${yAtas} ${x + r},${yAtas}H${x + w - r}Q${x + w},${yAtas} ${x + w},${yAtas + r}V${yAtas + h}Z`;
}

export default function ColumnChart({
  seri,
  data,
  formatNilai,
  formatSumbu,
  tinggi = 220,
}: Props) {
  const wadah = useRef<HTMLDivElement>(null);
  const [lebar, setLebar] = useState(0);
  const [aktif, setAktif] = useState<number | null>(null);
  const [modeTabel, setModeTabel] = useState(false);

  useEffect(() => {
    const el = wadah.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setLebar(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const kiri = 44;
  const kanan = 4;
  const atas = 8;
  const bawah = 24;
  const plotW = Math.max(0, lebar - kiri - kanan);
  const plotH = tinggi - atas - bawah;

  const nilaiMaks = Math.max(0, ...data.flatMap((d) => d.nilai));
  const langkah = nilaiMaks > 0 ? langkahBulat(nilaiMaks / 4) : 1000;
  const jumlahTick = Math.max(1, Math.ceil(nilaiMaks / langkah));
  const maks = langkah * jumlahTick;
  const ticks = Array.from({ length: jumlahTick + 1 }, (_, i) => i * langkah);
  const y = (v: number) => atas + plotH - (v / maks) * plotH;

  const band = data.length ? plotW / data.length : 0;
  const celah = 2;
  const lebarBatang = Math.max(
    2,
    Math.min(24, (band * 0.7 - celah * (seri.length - 1)) / seri.length),
  );
  const lebarGrup = lebarBatang * seri.length + celah * (seri.length - 1);
  // Label sumbu X dijarangkan supaya tidak bertumpuk (minimal ~36px per label)
  const setiap = Math.max(1, Math.ceil(36 / Math.max(band, 1)));

  const titikAktif = aktif !== null ? data[aktif] : null;
  const xTooltip =
    aktif !== null
      ? Math.min(Math.max(kiri + band * aktif + band / 2, 80), lebar - 80)
      : 0;

  const barisTabel = data.filter((d) => d.nilai.some((v) => v !== 0));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {seri.map((s) => (
            <span
              key={s.nama}
              className="flex items-center gap-1.5 text-xs text-zinc-600"
            >
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ background: s.warna }}
              />
              {s.nama}
            </span>
          ))}
        </div>
        <button
          onClick={() => setModeTabel(!modeTabel)}
          className="text-xs font-medium text-zinc-500 hover:text-zinc-900 px-2 py-1 rounded-md hover:bg-zinc-100 transition-colors"
        >
          {modeTabel ? "Lihat grafik" : "Lihat tabel"}
        </button>
      </div>

      {modeTabel ? (
        barisTabel.length === 0 ? (
          <p className="text-sm text-zinc-500 py-8 text-center">
            Belum ada data di periode ini.
          </p>
        ) : (
          <div className="max-h-64 overflow-auto rounded-lg border">
            <table className="w-full text-sm tabular-nums">
              <thead className="bg-zinc-50 text-xs text-zinc-500 sticky top-0">
                <tr>
                  <th className="text-left font-medium px-3 py-2">Waktu</th>
                  {seri.map((s) => (
                    <th
                      key={s.nama}
                      className="text-right font-medium px-3 py-2"
                    >
                      {s.nama}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {barisTabel.map((d) => (
                  <tr key={d.labelPanjang} className="border-t">
                    <td className="px-3 py-2 text-zinc-600">
                      {d.labelPanjang}
                    </td>
                    {d.nilai.map((v, i) => (
                      <td
                        key={i}
                        className="px-3 py-2 text-right text-zinc-900"
                      >
                        {formatNilai(v)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div ref={wadah} className="relative" style={{ height: tinggi }}>
          {lebar > 0 && (
            <svg
              width={lebar}
              height={tinggi}
              onPointerLeave={() => setAktif(null)}
              role="img"
              aria-label={`Grafik ${seri.map((s) => s.nama).join(" dan ")}`}
            >
              {ticks.map((t) => (
                <g key={t}>
                  <line
                    x1={kiri}
                    x2={kiri + plotW}
                    y1={y(t)}
                    y2={y(t)}
                    stroke={t === 0 ? SUMBU : GRID}
                    strokeWidth={1}
                  />
                  <text
                    x={kiri - 8}
                    y={y(t)}
                    textAnchor="end"
                    dominantBaseline="middle"
                    fontSize={11}
                    fill={TEKS_SUMBU}
                    className="tabular-nums"
                  >
                    {formatSumbu(t)}
                  </text>
                </g>
              ))}

              {data.map((d, i) => {
                const xGrup = kiri + band * i + (band - lebarGrup) / 2;
                return (
                  <g key={d.labelPanjang}>
                    {aktif === i && (
                      <rect
                        x={kiri + band * i}
                        y={atas}
                        width={band}
                        height={plotH}
                        fill={SOROT}
                      />
                    )}
                    {d.nilai.map((v, s) => {
                      const h = (v / maks) * plotH;
                      if (h <= 0) return null;
                      return (
                        <path
                          key={s}
                          d={pathBatang(
                            xGrup + s * (lebarBatang + celah),
                            y(v),
                            lebarBatang,
                            h,
                          )}
                          fill={seri[s].warna}
                        />
                      );
                    })}
                    {i % setiap === 0 && (
                      <text
                        x={kiri + band * i + band / 2}
                        y={tinggi - 6}
                        textAnchor="middle"
                        fontSize={11}
                        fill={TEKS_SUMBU}
                      >
                        {d.label}
                      </text>
                    )}
                    {/* Area sentuh selebar satu kolom, lebih besar dari batangnya */}
                    <rect
                      x={kiri + band * i}
                      y={atas}
                      width={band}
                      height={plotH}
                      fill="transparent"
                      tabIndex={0}
                      aria-label={`${d.labelPanjang}: ${seri
                        .map((s, si) => `${s.nama} ${formatNilai(d.nilai[si])}`)
                        .join(", ")}`}
                      onPointerEnter={() => setAktif(i)}
                      onFocus={() => setAktif(i)}
                      onBlur={() => setAktif(null)}
                      className="outline-none"
                    />
                  </g>
                );
              })}
            </svg>
          )}

          {titikAktif && (
            <div
              className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg border bg-white px-3 py-2 shadow-md text-xs min-w-36"
              style={{ left: xTooltip }}
            >
              <p className="text-zinc-500 mb-1">{titikAktif.labelPanjang}</p>
              {seri.map((s, si) => (
                <p key={s.nama} className="flex items-center gap-2">
                  <span
                    className="h-0.5 w-3 rounded-full"
                    style={{ background: s.warna }}
                  />
                  <span className="font-semibold text-zinc-900 tabular-nums">
                    {formatNilai(titikAktif.nilai[si])}
                  </span>
                  <span className="text-zinc-500">{s.nama}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
