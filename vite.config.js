import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,ico,woff2}"],
        // Cache Google Fonts at runtime
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-css",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-woff",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
        // Fallback to offline page when network fails
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/api\//],
      },
      includeAssets: [
        "favicon.svg",
        "apple-touch-icon.png",
        "icon-192.png",
        "icon-512.png",
        "splash-*.png",
      ],
      manifest: {
        name: "Ennie — Energy Healing",
        short_name: "Ennie",
        description: "AI-mediated energy healing sessions",
        theme_color: "#8B3FFF",
        background_color: "#FFFFFF",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        id: "/",
        categories: ["health", "medical", "lifestyle"],
        icons: [
          {
            src: "icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],

  build: {
    // Target modern browsers (iOS 15+, Android Chrome 100+)
    target: ["es2020", "chrome100", "safari15"],
    // Enable source maps for production debugging
    sourcemap: "hidden",
    // CSS code splitting
    cssCodeSplit: true,
    // Asset handling
    assetsInlineLimit: 4096,
    // Chunk splitting for optimal caching
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
        },
        // Deterministic asset file names for long-term caching
        assetFileNames: "assets/[name]-[hash][extname]",
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
      },
    },
    // Minification
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: false, // Keep console for error reporting
        drop_debugger: true,
        passes: 2,
      },
    },
  },

  server: {
    host: "0.0.0.0",
    port: 3000,
  },
  preview: {
    host: "0.0.0.0",
    port: parseInt(process.env.PORT) || 3000,
  },
});
