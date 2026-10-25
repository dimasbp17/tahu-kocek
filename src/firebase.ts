import { initializeApp } from "firebase/app";
import { getAuth, signOut } from "firebase/auth";
import {
  clearIndexedDbPersistence,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  terminate,
  waitForPendingWrites,
} from "firebase/firestore";
import toast from "react-hot-toast";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
// Data disimpan juga di perangkat, jadi aplikasi tetap jalan saat offline
// dan transaksi otomatis terkirim begitu online lagi
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
export const auth = getAuth(app);

// Identitas akun yang sedang login, disimpan di setiap transaksi baru
export function dataPencatat() {
  const user = auth.currentUser;
  return {
    createdBy: user?.displayName ?? user?.email ?? "",
    createdByEmail: user?.email ?? "",
  };
}

// Tulis ke Firestore tanpa menunggu jawaban server. Data langsung masuk cache
// lokal dan tampil di aplikasi; kalau ditolak server, perubahannya dibatalkan.
// Mengembalikan true kalau sedang online.
export function tulisOffline(proses: Promise<unknown>, pesanGagal: string) {
  proses.catch((e) => toast.error(`${pesanGagal}: ${e}`));
  return navigator.onLine;
}

// Keluar sekaligus hapus cache offline, supaya data tidak tertinggal di perangkat
export async function keluar() {
  const terkirim = await Promise.race([
    waitForPendingWrites(db).then(() => true),
    new Promise<boolean>((r) => setTimeout(() => r(false), 5000)),
  ]);
  if (!terkirim) {
    toast.error(
      "Masih ada transaksi yang belum terkirim. Sambungkan internet dulu sebelum keluar.",
    );
    return;
  }
  await signOut(auth);
  try {
    await terminate(db);
    await clearIndexedDbPersistence(db);
  } catch {
    // Gagal kalau aplikasi masih terbuka di tab lain; cache dibersihkan lain waktu
  }
  window.location.reload();
}
