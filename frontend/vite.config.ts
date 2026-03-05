import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react({
      // Enable React Fast Refresh
      fastRefresh: true,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    target: "es2020", // Modern target for better tree-shaking
    sourcemap: mode !== "production", // Disable sourcemaps in production
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: mode === "production", // Remove console.logs in production
        drop_debugger: true,
        pure_funcs: mode === "production" ? ["console.log", "console.debug"] : [],
        passes: 2,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core React — in one stable chunk so all other modules share the same React instance
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router-dom/') ||
            id.includes('node_modules/scheduler/')
          ) {
            return 'vendor';
          }
          // PDF/export — genuinely standalone (no React), only loaded in admin
          if (id.includes('node_modules/jspdf') || id.includes('node_modules/jspdf-autotable')) {
            return 'pdf';
          }
          // NOTE: lucide-react, @radix-ui, framer-motion, recharts, react-hook-form
          // are intentionally NOT split into separate chunks — they all call
          // React.forwardRef / React.createContext at module-evaluation time and
          // must share the same React instance from the vendor chunk. Splitting them
          // causes "Cannot read properties of undefined (reading 'forwardRef')" in
          // production because of ESM chunk initialisation order.
        },
        // Better file naming for long-term caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 1000,
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Optimize dependencies
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "framer-motion",
      "recharts",
    ],
  },
  preview: {
    port: 8080,
    host: "::",
  },
}));
