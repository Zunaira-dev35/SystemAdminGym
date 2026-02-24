import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import viteRuntimeErrorOverlayPlugin from '@replit/vite-plugin-runtime-error-modal'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [ tailwindcss(),react(),
       viteRuntimeErrorOverlayPlugin(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname,  "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  build: {
    rollupOptions: {
      external: ['WebSdk'], // Treat as external global
    },
  },
})
