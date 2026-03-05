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
          // Core React libraries — loaded first
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router-dom/')) {
            return 'vendor';
          }
          // Heavy PDF/export library — only loaded on admin pages
          if (id.includes('node_modules/jspdf') || id.includes('node_modules/jspdf-autotable')) {
            return 'pdf';
          }
          // Chart libraries
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) {
            return 'charts';
          }
          // Animation library
          if (id.includes('node_modules/framer-motion')) {
            return 'animations';
          }
          // Icons
          if (id.includes('node_modules/lucide-react')) {
            return 'icons';
          }
          // Radix UI components
          if (id.includes('node_modules/@radix-ui/')) {
            return 'ui';
          }
          // Form libraries
          if (id.includes('node_modules/react-hook-form') || id.includes('node_modules/zod') || id.includes('node_modules/@hookform/')) {
            return 'forms';
          }
          // Admin pages — lazy-loaded separately
          if (id.includes('/pages/admin/')) {
            return 'admin';
          }
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
