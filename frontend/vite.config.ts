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
    sourcemap: mode !== "production", // Disable sourcemaps in production
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: mode === "production", // Remove console.logs in production
        drop_debugger: true,
        pure_funcs: mode === "production" ? ["console.log", "console.debug"] : [],
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries
          vendor: ["react", "react-dom", "react-router-dom"],
          // UI component libraries
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-tabs", "@radix-ui/react-toast", "@radix-ui/react-dropdown-menu", "@radix-ui/react-select"],
          // Charts and visualization
          charts: ["recharts"],
          // Form handling
          forms: ["react-hook-form", "zod"],
          // Animation libraries
          animations: ["framer-motion"],
          // Icons
          icons: ["lucide-react"],
        },
        // Better file naming for caching
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
