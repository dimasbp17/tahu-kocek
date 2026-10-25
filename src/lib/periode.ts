export type Periode = "hari" | "7hari" | "30hari" | "bulan";

export const PILIHAN_PERIODE: {
  id: Periode;
  label: string;
  pembanding: string;
}[] = [
  { id: "hari", label: "Hari ini", pembanding: "kemarin di jam yang sama" },
  { id: "7hari", label: "7 hari", pembanding: "7 hari sebelumnya" },
  { id: "30hari", label: "30 hari", pembanding: "30 hari sebelumnya" },
  { id: "bulan", label: "Bulan ini", pembanding: "bulan lalu" },
];

export interface Rentang {
  mulai: Date;
  // Periode pembanding: [mulaiLalu, akhirLalu), panjangnya sama dengan periode sekarang
  mulaiLalu: Date;
  akhirLalu: Date;
}

export interface Bucket {
  mulai: Date;
  akhir: Date;
  label: string; // Label pendek di sumbu
  labelPanjang: string; // Judul tooltip & tabel
}

const awalHari = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

const tambahHari = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export function rentangPeriode(p: Periode, now = new Date()): Rentang {
  const hariIni = awalHari(now);
  if (p === "hari") {
    return {
      mulai: hariIni,
      mulaiLalu: tambahHari(hariIni, -1),
      akhirLalu: tambahHari(now, -1),
    };
  }
  if (p === "7hari" || p === "30hari") {
    const n = p === "7hari" ? 7 : 30;
    const mulai = tambahHari(hariIni, -(n - 1));
    return {
      mulai,
      mulaiLalu: tambahHari(mulai, -n),
      akhirLalu: tambahHari(now, -n),
    };
  }
  // Bulan ini dibandingkan dengan tanggal yang sama bulan lalu
  const mulai = new Date(now.getFullYear(), now.getMonth(), 1);
  const hariTerakhirBulanLalu = new Date(
    now.getFullYear(),
    now.getMonth(),
    0,
  ).getDate();
  return {
    mulai,
    mulaiLalu: new Date(now.getFullYear(), now.getMonth() - 1, 1),
    akhirLalu: new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      Math.min(now.getDate(), hariTerakhirBulanLalu),
      now.getHours(),
      now.getMinutes(),
      now.getSeconds(),
    ),
  };
}

// Batang grafik: per jam untuk hari ini, per hari untuk periode lain
export function bucketPeriode(p: Periode, now = new Date()): Bucket[] {
  const { mulai } = rentangPeriode(p, now);
  if (p === "hari") {
    return Array.from({ length: 24 }, (_, jam) => {
      const awal = new Date(mulai);
      awal.setHours(jam);
      const akhir = new Date(mulai);
      akhir.setHours(jam + 1);
      const dua = String(jam).padStart(2, "0");
      return {
        mulai: awal,
        akhir,
        label: dua,
        labelPanjang: `Pukul ${dua}.00–${String(jam + 1).padStart(2, "0")}.00`,
      };
    });
  }
  const jumlahHari =
    Math.round((awalHari(now).getTime() - mulai.getTime()) / 86_400_000) + 1;
  return Array.from({ length: jumlahHari }, (_, i) => {
    const awal = tambahHari(mulai, i);
    return {
      mulai: awal,
      akhir: tambahHari(awal, 1),
      label:
        p === "7hari"
          ? awal.toLocaleDateString("id-ID", { weekday: "short" })
          : String(awal.getDate()),
      labelPanjang: awal.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    };
  });
}
