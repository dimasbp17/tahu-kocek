import { Button } from "@/components/ui/button";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";
import {
  FileText,
  LayoutDashboard,
  LogOut,
  Wallet,
  Settings as SettingsIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  NavLink,
  useLocation,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { auth, db, keluar, tulisOffline } from "./firebase";
import { useOnline } from "./hooks/use-online";
import KasirTab from "./components/common/kasir-tab";
import LoginScreen from "./components/common/login-screen";
import LaporanTab from "./components/common/laporan-tab";
import PengaturanTab from "./components/common/pengaturan-tab";
import PengeluaranTab from "./components/common/pengeluaran-tab";
import RingkasanTab from "./components/common/ringkasan-tab";
import TutupKasTab from "./components/common/tutup-kas-tab";
import type { Settings, Transaction } from "./interface/types";

const DEFAULT_SETTINGS: Settings = {
  hargaLuring: 10000,
  hargaShopee: 12500,
  hppPerPorsi: 6000,
  tanggalSiklus: 25,
  komisiShopee: 30,
};

// Judul halaman di top bar desktop
const JUDUL_HALAMAN: Record<string, string> = {
  "/ringkasan": "Ringkasan",
  "/laporan": "Laporan",
  "/tutup-kas": "Tutup Kas",
  "/pengaturan": "Setelan",
  "/kasir": "Catat Penjualan",
  "/pengeluaran": "Catat Pengeluaran",
};

// ─── Context / shared state ──────────────────────────────────────────────────
// Settings & transactions di-lift ke layout supaya semua route bisa akses
function Layout() {
  // undefined = status login belum diketahui, null = belum login
  const [user, setUser] = useState<User | null | undefined>(undefined);
  // false sampai data pertama berhasil diambil, supaya Beranda tidak sempat tampil kosong
  const [dataSiap, setDataSiap] = useState(false);
  const [setelanSiap, setSetelanSiap] = useState(false);
  // false selama setelan bersama belum pernah disimpan ke Firestore
  const [setelanTersimpan, setSetelanTersimpan] = useState(true);
  const online = useOnline();
  const { pathname } = useLocation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  // Setelan lama di perangkat ini hanya dipakai sampai setelan bersama di Firestore pertama kali disimpan
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem("tahuKocekSettings");
    // Digabung dengan default supaya setelan lama yang belum punya field baru tetap lengkap
    return saved
      ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
      : DEFAULT_SETTINGS;
  });

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUser(u);
        // Kosongkan data akun sebelumnya saat ganti akun
        setTransactions([]);
        setDataSiap(false);
        setSetelanSiap(false);
      }),
    [],
  );

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "transaksi"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Transaction, "id">),
        }));
        setTransactions(data);
        setDataSiap(true);
      },
      (err) => {
        // Email tidak terdaftar di Firestore rules: keluarkan lagi ke layar login
        if (err.code === "permission-denied") {
          toast.error(`Akun ${user.email} tidak memiliki akses`, {
            id: "akses-ditolak",
          });
          signOut(auth);
        } else {
          toast.error("Gagal memuat data: " + err.message);
          setDataSiap(true);
        }
      },
    );
    return () => unsubscribe();
  }, [user]);

  // Setelan bersama untuk semua perangkat
  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      doc(db, "pengaturan", "umum"),
      (snap) => {
        setSetelanTersimpan(snap.exists());
        if (snap.exists()) {
          setSettings({
            ...DEFAULT_SETTINGS,
            ...(snap.data() as Partial<Settings>),
          });
        }
        setSetelanSiap(true);
      },
      (err) => {
        // Tidak dikeluarkan di sini: penolakan akses sudah ditangani listener transaksi
        if (err.code !== "permission-denied") {
          toast.error("Gagal memuat setelan: " + err.message);
        }
        setSetelanSiap(true);
      },
    );
  }, [user]);

  const simpanSettings = (baru: Settings) =>
    tulisOffline(
      setDoc(doc(db, "pengaturan", "umum"), baru),
      "Gagal menyimpan setelan",
    );

  const navItems = [
    { to: "/ringkasan", icon: LayoutDashboard, label: "Ringkasan" },
    { to: "/laporan", icon: FileText, label: "Laporan" },
    { to: "/tutup-kas", icon: Wallet, label: "Tutup Kas" },
    { to: "/pengaturan", icon: SettingsIcon, label: "Setelan" },
  ];

  const judulHalaman = JUDUL_HALAMAN[pathname] ?? "Tahu Kocek DL";

  if (user === undefined || (user && !(dataSiap && setelanSiap))) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center text-sm text-zinc-500 font-sans">
        Memuat...
      </div>
    );
  }
  // Layar login selalu di "/"; setelah login, "/" diarahkan ke /ringkasan
  if (!user) {
    return pathname === "/" ? <LoginScreen /> : <Navigate to="/" replace />;
  }

  return (
    <div className="font-sans md:flex md:min-h-screen md:bg-zinc-50">
      {/* Sidebar khusus desktop */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 sticky top-0 h-screen bg-white border-r">
        <div className="flex items-center gap-2.5 px-5 h-16 border-b">
          <img src="/tahu.png" alt="" className="h-8 w-8" />
          <h1 className="text-base font-semibold tracking-tight text-zinc-900">
            Tahu Kocek DL
          </h1>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="max-w-md mx-auto bg-zinc-50 min-h-screen pb-24 font-sans md:max-w-none md:mx-0 md:flex-1 md:min-w-0 md:pb-0">
        <header className="bg-white border-b px-4 h-14 sticky top-0 z-10 flex items-center justify-between gap-3 md:hidden">
          <div className="flex items-center gap-2">
            <img src="/tahu.png" alt="" className="h-7 w-7" />
            <h1 className="text-base font-semibold tracking-tight text-zinc-900">
              Tahu Kocek DL
            </h1>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm text-zinc-600 truncate">
              {user.displayName?.split(" ")[0] ?? user.email}
            </span>
            <Avatar user={user} />
            <button
              onClick={keluar}
              title="Keluar"
              aria-label="Keluar"
              className="shrink-0 p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Top bar khusus desktop */}
        <header className="hidden md:flex sticky top-0 z-10 h-16 items-center justify-between gap-4 bg-white border-b px-8">
          <h2 className="text-base font-semibold text-zinc-900">
            {judulHalaman}
          </h2>
          <div className="flex items-center gap-4">
            <span
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                online
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${online ? "bg-emerald-600" : "bg-amber-500"}`}
              />
              {online ? "Online" : "Offline"}
            </span>
            <div className="flex items-center gap-3 border-l pl-4">
              <Avatar user={user} />
              <div className="min-w-0 max-w-48">
                <p className="text-sm font-medium text-zinc-900 truncate">
                  {user.displayName ?? "Pengguna"}
                </p>
                <p className="text-xs text-zinc-500 truncate">{user.email}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={keluar}
                title="Keluar"
                aria-label="Keluar"
                className="shrink-0 text-zinc-500 hover:text-rose-600 hover:bg-rose-50"
              >
                <LogOut size={18} />
              </Button>
            </div>
          </div>
        </header>

        {!online && (
          <div className="bg-amber-100 text-amber-800 text-xs font-medium text-center px-4 py-2">
            Sedang offline. Transaksi tetap tersimpan dan dikirim otomatis saat
            online.
          </div>
        )}

        <main className="p-4 space-y-6 md:p-8 md:max-w-6xl md:mx-auto md:w-full">
          {/* Outlet menerima props lewat context */}
          <Outlet
            context={{
              transactions,
              settings,
              setelanTersimpan,
              simpanSettings,
            }}
          />
        </main>

        <nav className="fixed bottom-0 w-full max-w-md bg-white border-t flex justify-around p-2 pb-safe z-50 md:hidden">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center p-2 transition-colors rounded-lg ${
                  isActive ? "text-blue-700" : "text-zinc-400 hover:bg-zinc-50"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={22} className={isActive ? "fill-blue-50" : ""} />
                  <span className="text-[10px] font-semibold mt-1">
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}

// Foto profil Google, atau huruf awal nama kalau tidak ada foto
function Avatar({ user }: { user: User }) {
  const [gagal, setGagal] = useState(false);
  const inisial = (user.displayName ?? user.email ?? "?")[0].toUpperCase();

  if (!user.photoURL || gagal) {
    return (
      <div className="h-8 w-8 shrink-0 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">
        {inisial}
      </div>
    );
  }
  return (
    <img
      src={user.photoURL}
      alt=""
      referrerPolicy="no-referrer"
      onError={() => setGagal(true)}
      className="h-8 w-8 shrink-0 rounded-full object-cover"
    />
  );
}

// ─── Pages ───────────────────────────────────────────────────────────────────
import { useOutletContext } from "react-router-dom";

type LayoutContext = {
  transactions: Transaction[];
  settings: Settings;
  setelanTersimpan: boolean;
  simpanSettings: (s: Settings) => boolean;
};

function Dashboard() {
  const { transactions } = useOutletContext<LayoutContext>();
  const navigate = useNavigate();
  return (
    <RingkasanTab
      transactions={transactions}
      onJual={() => navigate("/kasir")}
      onModal={() => navigate("/pengeluaran")}
      onLihatSemua={() => navigate("/laporan")}
    />
  );
}

function KasirPage() {
  const { settings } = useOutletContext<LayoutContext>();
  const navigate = useNavigate();
  return (
    <div className="md:max-w-xl">
      <KasirTab settings={settings} onSuccess={() => navigate("/ringkasan")} />
    </div>
  );
}

function LaporanPage() {
  const { transactions, settings } = useOutletContext<LayoutContext>();
  return <LaporanTab transactions={transactions} settings={settings} />;
}

function TutupKasPage() {
  const { transactions } = useOutletContext<LayoutContext>();
  return <TutupKasTab transactions={transactions} />;
}

function PengaturanPage() {
  const { settings, setelanTersimpan, simpanSettings } =
    useOutletContext<LayoutContext>();
  return (
    <div className="md:max-w-3xl">
      {/* key: form ikut diperbarui saat setelan berubah dari perangkat lain */}
      <PengaturanTab
        key={JSON.stringify(settings)}
        settings={settings}
        setelanTersimpan={setelanTersimpan}
        simpanSettings={simpanSettings}
      />
    </div>
  );
}

function PengeluaranPage() {
  const navigate = useNavigate();
  return (
    <div className="md:max-w-xl">
      <PengeluaranTab onSuccess={() => navigate("/ringkasan")} />
    </div>
  );
}

// ─── Router ──────────────────────────────────────────────────────────────────
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      // Alamat lama "/" dan alamat yang tidak dikenal diarahkan ke Ringkasan
      { index: true, element: <Navigate to="/ringkasan" replace /> },
      { path: "ringkasan", element: <Dashboard /> },
      { path: "kasir", element: <KasirPage /> },
      { path: "laporan", element: <LaporanPage /> },
      { path: "tutup-kas", element: <TutupKasPage /> },
      { path: "pengaturan", element: <PengaturanPage /> },
      { path: "pengeluaran", element: <PengeluaranPage /> },
      { path: "*", element: <Navigate to="/ringkasan" replace /> },
    ],
  },
]);

export default function App() {
  return (
    <>
      <Toaster position="top-center" />
      <RouterProvider router={router} />
    </>
  );
}
