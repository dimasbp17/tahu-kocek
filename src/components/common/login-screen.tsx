import { useState } from "react";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import toast from "react-hot-toast";
import { auth } from "@/firebase";

interface Props {
  emailDitolak?: string | null; // Diisi kalau sudah login tapi email tidak terdaftar di rules
}

export default function LoginScreen({ emailDitolak }: Props) {
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
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <Card className="w-full max-w-sm shadow-md animate-in fade-in slide-in-from-bottom-4 duration-300">
        <CardHeader>
          <CardTitle className="text-xl">Tahu Kocek DL</CardTitle>
          <CardDescription>
            {emailDitolak
              ? `Akun ${emailDitolak} belum punya akses. Minta pemilik menambahkan email ini.`
              : "Masuk untuk mencatat penjualan."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {emailDitolak ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => signOut(auth)}
            >
              Keluar & ganti akun
            </Button>
          ) : (
            <Button
              onClick={masuk}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Membuka Google..." : "Masuk dengan Google"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
