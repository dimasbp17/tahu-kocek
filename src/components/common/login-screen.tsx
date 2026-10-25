import { useState } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { LayoutDashboard, Loader2, Users, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { auth } from "@/firebase";

const KEUNGGULAN = [
  {
    Ikon: LayoutDashboard,
    judul: "Ringkasan laba & grafik",
    isi: "Pendapatan, belanja, dan level terlaris dalam satu layar.",
  },
  {
    Ikon: WifiOff,
    judul: "Tetap jalan saat offline",
    isi: "Transaksi tersimpan di HP dan terkirim otomatis saat online.",
  },
  {
    Ikon: Users,
    judul: "Dipakai bersama tim",
    isi: "Setiap transaksi mencatat siapa yang menginputnya.",
  },
];

// Logo "G" resmi untuk tombol masuk dengan Google
function LogoGoogle() {
  return (
    <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);

  const masuk = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (e) {
      // Popup ditutup sendiri oleh pengguna bukan error
      if (
        !(e instanceof FirebaseError) ||
        e.code !== "auth/popup-closed-by-user"
      ) {
        toast.error("Gagal masuk: " + e);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans lg:grid lg:grid-cols-2">
      {/* Panel kiri khusus desktop */}
      <aside className="hidden lg:flex flex-col justify-between bg-white border-r p-12">
        <div className="flex items-center gap-2.5">
          <img src="/tahu.png" alt="" className="h-9 w-9" />
          <span className="text-base font-semibold text-zinc-900">
            Tahu Kocek DL
          </span>
        </div>

        <div className="max-w-md space-y-8">
          <h2 className="text-3xl font-semibold leading-tight text-zinc-900">
            Catat penjualan dan pantau laba, di mana saja.
          </h2>
          <ul className="space-y-5">
            {KEUNGGULAN.map(({ Ikon, judul, isi }) => (
              <li key={judul} className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  <Ikon size={18} />
                </span>
                <div>
                  <p className="text-sm font-medium text-zinc-900">{judul}</p>
                  <p className="text-sm text-zinc-500">{isi}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-zinc-400">
          © {new Date().getFullYear()} Tahu Kocek DL
        </p>
      </aside>

      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Logo di HP */}
          <div className="flex flex-col items-center gap-2 lg:hidden">
            <img src="/tahu.png" alt="" className="h-14 w-14" />
            <span className="text-lg font-semibold text-zinc-900">
              Tahu Kocek DL
            </span>
          </div>

          <div className="rounded-xl bg-white ring-1 ring-zinc-900/10 p-6 space-y-6">
            <div className="space-y-1">
              <h1 className="text-xl font-semibold text-zinc-900">Masuk</h1>
              <p className="text-sm text-zinc-500">
                Gunakan akun Google yang sudah didaftarkan pemilik.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={masuk}
              disabled={loading}
              className="h-11 w-full gap-2.5 bg-white text-zinc-900 hover:bg-zinc-50"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <LogoGoogle />
              )}
              {loading ? "Membuka Google..." : "Masuk dengan Google"}
            </Button>
          </div>

          <p className="text-center text-xs text-zinc-500">
            Akun yang tidak terdaftar tidak bisa membuka data.
          </p>
        </div>
      </main>
    </div>
  );
}
