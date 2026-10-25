import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // PWA: aplikasi bisa di-install ke HP dan tetap terbuka tanpa internet
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["tahu.png"],
      manifest: {
        name: "Tahu Kocek DL",
        short_name: "Tahu Kocek",
        description: "Catat penjualan dan keuangan Tahu Kocek",
        lang: "id",
        start_url: "/ringkasan",
        display: "standalone",
        theme_color: "#ffffff",
        background_color: "#fafafa",
        icons: [
          {
            src: "/tahu.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,woff2}"],
        // Jalur khusus Firebase Auth jangan diarahkan ke aplikasi
        navigateFallbackDenylist: [/^\/__\//],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
