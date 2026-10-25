import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import {
  FileText,
  Home,
  Minus,
  Plus,
  Settings as SettingsIcon,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  NavLink,
  useNavigate,
} from "react-router-dom";
import { db } from "./firebase";
import KasirTab from "./components/common/kasir-tab";
import LaporanTab from "./components/common/laporan-tab";
import PengaturanTab from "./components/common/pengaturan-tab";
import PengeluaranTab from "./components/common/pengeluaran-tab";
import type { Settings, Transaction } from "./interface/types";

// ─── Context / shared state ──────────────────────────────────────────────────
// Settings & transactions di-lift ke layout supaya semua route bisa akses
function Layout() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem("tahuKocekSettings");
    return saved
      ? JSON.parse(saved)
      : {
          hargaLuring: 10000,
          hargaShopee: 12500,
          hppPerPorsi: 6000,
          tanggalSiklus: 25,
          komisiShopee: 30,
        };
  });

  useEffect(() => {
    localStorage.setItem("tahuKocekSettings", JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const q = query(collection(db, "transaksi"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Transaction, "id">),
      }));
      setTransactions(data);
    });
    return () => unsubscribe();
  }, []);

  const navItems = [
    { to: "/", icon: Home, label: "Beranda" },
    { to: "/laporan", icon: FileText, label: "Laporan" },
    { to: "/pengaturan", icon: SettingsIcon, label: "Setelan" },
  ];

  return (
    <div className="font-sans md:flex md:min-h-screen md:bg-slate-100">
      {/* Sidebar khusus desktop */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 sticky top-0 h-screen bg-white border-r">
        <div className="bg-blue-600 text-white p-5">
          <h1 className="text-xl font-bold tracking-tight">Tahu Kocek DL</h1>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-zinc-500 hover:bg-zinc-50"
                }`
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="max-w-md mx-auto rounded-xl bg-slate-100 min-h-screen pb-24 font-sans md:max-w-none md:mx-0 md:flex-1 md:min-w-0 md:rounded-none md:pb-0">
        <header className="bg-blue-600 text-white p-5 shadow-sm sticky top-0 z-10 md:hidden">
          <h1 className="text-xl font-bold tracking-tight">Tahu Kocek DL</h1>
        </header>

        <Toaster position="top-center" />

        <main className="p-4 space-y-6 md:p-8 md:max-w-5xl md:mx-auto md:w-full">
          {/* Outlet menerima props lewat context */}
          <Outlet context={{ transactions, settings, setSettings }} />
        </main>

        <nav className="fixed bottom-0 w-full max-w-md bg-white border-t flex justify-around p-2 pb-safe shadow-[0_-4px_15px_-3px_rgba(0,0,0,0.05)] z-50 md:hidden">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex flex-col items-center p-2 transition-colors rounded-lg ${
                  isActive ? "text-blue-600" : "text-zinc-400 hover:bg-zinc-50"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={24} className={isActive ? "fill-blue-50" : ""} />
                  <span className="text-[10px] font-bold mt-1">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}

// ─── Pages ───────────────────────────────────────────────────────────────────
import { useOutletContext } from "react-router-dom";

type LayoutContext = {
  transactions: Transaction[];
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
};

function Dashboard() {
  const { transactions } = useOutletContext<LayoutContext>();
  const navigate = useNavigate();

  const getTodayString = () => new Date().toISOString().split("T")[0];
  const todayTransactions = transactions.filter((t) =>
    t.date.startsWith(getTodayString()),
  );

  const totalPemasukan = todayTransactions
    .filter((t) => t.type === "IN")
    .reduce((sum, t) => sum + t.amount, 0);

  const pengeluaranBelanja = todayTransactions
    .filter((t) => t.type === "OUT" && t.category === "belanja")
    .reduce((sum, t) => sum + t.amount, 0);

  const pengeluaranTarik = todayTransactions
    .filter((t) => t.type === "OUT" && t.category === "tarik")
    .reduce((sum, t) => sum + t.amount, 0);

  const arusKas = totalPemasukan - pengeluaranBelanja - pengeluaranTarik;
  const labaReal = totalPemasukan - pengeluaranBelanja;

  const porsiLaku = todayTransactions
    .filter((t) => t.type === "IN")
    .reduce((sum, t) => sum + (t.qty || 0), 0);

  const labaPerPorsi = todayTransactions
    .filter((t) => t.type === "IN")
    .reduce((sum, t) => sum + (t.netProfit || 0), 0);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 lg:grid lg:grid-cols-3 lg:gap-4 lg:space-y-0">
      <Card className="border-blue-100 shadow-md lg:col-span-2">
        <CardHeader className="pb-2">
          <CardDescription>Uang di Tangan Hari Ini</CardDescription>
          <CardTitle className="text-4xl text-zinc-900 font-semibold">
            Rp {arusKas.toLocaleString("id-ID")}
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:col-span-2 lg:gap-4">
        <Card className="bg-emerald-50 border-emerald-100 shadow-sm">
          <CardContent>
            <div className="flex items-center gap-2 text-emerald-700 mb-2">
              <ShoppingBag size={16} />
              <span className="text-xs font-bold uppercase">Omset Kotor</span>
            </div>
            <p className="text-lg font-bold text-emerald-900">
              Rp {totalPemasukan.toLocaleString("id-ID")}
            </p>
            <p className="text-xs text-emerald-600 mt-1">
              {porsiLaku} Porsi Terjual
            </p>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-amber-100 shadow-sm">
          <CardContent>
            <div className="flex items-center gap-2 text-amber-700 mb-2">
              <TrendingUp size={16} />
              <span className="text-xs font-bold uppercase">
                Laba per Porsi
              </span>
            </div>
            <p className="text-lg font-bold text-amber-900">
              Rp {labaPerPorsi.toLocaleString("id-ID")}
            </p>
            <p className="text-xs text-amber-600 mt-1">Setelah HPP</p>
          </CardContent>
        </Card>
      </div>

      <Card
        className={`col-span-2 shadow-sm lg:col-span-1 lg:col-start-3 lg:row-start-2 ${labaReal >= 0 ? "bg-white" : "bg-rose-50 border-rose-100"}`}
      >
        <CardContent className="space-y-3">
          <div
            className={`flex items-center gap-2 ${labaReal >= 0 ? "text-indigo-700" : "text-rose-700"}`}
          >
            <TrendingUp size={16} />
            <span className="text-xs font-bold uppercase">
              Laba Bersih Real
            </span>
          </div>

          <div className="space-y-1 text-sm text-zinc-600">
            <div className="flex justify-between">
              <span>Omset Kotor</span>
              <span className="font-semibold text-zinc-800">
                Rp {totalPemasukan.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Belanja Bahan</span>
              <span className="font-semibold text-rose-600">
                - Rp {pengeluaranBelanja.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="border-t border-zinc-200 pt-1 flex justify-between">
              <span className="font-bold text-zinc-800">Untung</span>
              <span
                className={`font-bold text-lg ${labaReal >= 0 ? "text-indigo-700" : "text-rose-700"}`}
              >
                Rp {labaReal.toLocaleString("id-ID")}
              </span>
            </div>
            {pengeluaranTarik > 0 && (
              <>
                <div className="flex justify-between text-zinc-500">
                  <span>Sudah Ditarik</span>
                  <span className="font-semibold text-amber-600">
                    - Rp {pengeluaranTarik.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-zinc-800">Sisa di Kas</span>
                  <span className="font-bold text-zinc-900">
                    Rp {arusKas.toLocaleString("id-ID")}
                  </span>
                </div>
              </>
            )}
          </div>

          <div
            className={`text-xs font-bold px-3 py-1.5 rounded-full inline-block ${labaReal >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
          >
            {labaReal >= 0
              ? "✓ Modal sudah balik"
              : `Kurang Rp ${Math.abs(labaReal).toLocaleString("id-ID")} lagi balik modal`}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 pt-2 lg:col-start-3 lg:row-start-1 lg:grid-cols-1 lg:content-center lg:gap-3 lg:pt-0">
        <Button
          onClick={() => navigate("/kasir")}
          size="lg"
          className=" bg-blue-600 hover:bg-blue-700 shadow-lg"
        >
          <Plus className="h-4 w-4" /> Jual
        </Button>
        <Button
          onClick={() => navigate("/pengeluaran")}
          size="lg"
          variant="outline"
          className=" border-zinc-300 text-zinc-700 shadow-sm"
        >
          <Minus className="h-4 w-4" /> Modal
        </Button>
      </div>
    </div>
  );
}

function KasirPage() {
  const { settings } = useOutletContext<LayoutContext>();
  const navigate = useNavigate();
  return (
    <div className="md:max-w-xl md:mx-auto">
      <KasirTab settings={settings} onSuccess={() => navigate("/")} />
    </div>
  );
}

function LaporanPage() {
  const { transactions } = useOutletContext<LayoutContext>();
  return <LaporanTab transactions={transactions} />;
}

function PengaturanPage() {
  const { settings, setSettings } = useOutletContext<LayoutContext>();
  return (
    <div className="md:max-w-xl md:mx-auto">
      <PengaturanTab settings={settings} setSettings={setSettings} />
    </div>
  );
}

function PengeluaranPage() {
  const navigate = useNavigate();
  return (
    <div className="md:max-w-xl md:mx-auto">
      <PengeluaranTab onSuccess={() => navigate("/")} />
    </div>
  );
}

// ─── Router ──────────────────────────────────────────────────────────────────
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "kasir", element: <KasirPage /> },
      { path: "laporan", element: <LaporanPage /> },
      { path: "pengaturan", element: <PengaturanPage /> },
      { path: "pengeluaran", element: <PengeluaranPage /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
