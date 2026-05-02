import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import svgr from "vite-plugin-svgr";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/",
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate date picker into its own chunk
          "date-pickers": ["@mui/x-date-pickers"],
          // Separate MUI components
          "mui-core": ["@mui/material", "@mui/icons-material"],
          // Separate animation library
          "framer-motion": ["framer-motion"],
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: true, // so updates work during dev too
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB limit
        cleanupOutdatedCaches: true,
      },
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
      manifest: {
        name: "Vihiga LIMS eDAMS Admin Portal",
        short_name: "Vihiga LIMS Admin",
        description:
          "Vihiga County - Electronic Development Application Management System Admin Portal",
        theme_color: "#ffffff",
        icons: [
          {
            src: "favicon-16x16.png",
            sizes: "16x16",
            type: "image/png",
          },
          {
            src: "favicon-32x32.png",
            sizes: "32x32",
            type: "image/png",
          },
          {
            src: "apple-touch-icon.png",
            sizes: "180x180",
            type: "image/png",
          },
        ],
      },
    }),
    svgr(),
  ],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
    css: true,
    reporters: ["verbose"],
    coverage: {
      reporter: ["text", "json", "html"],
      include: ["src/**/*"],
      exclude: [],
    },
  },
  server: {
    port: 3000,
    host: true,
    open: true,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
        secure: false,
      },
      "/uploads": {
        target: "http://localhost:4000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
