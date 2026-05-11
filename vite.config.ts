import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  build: {
    emptyOutDir: true,
    outDir: "dist",
    sourcemap: true,
    cssCodeSplit: false,
    rollupOptions: {
      input: "src/content/index.tsx",
      output: {
        format: "iife",
        entryFileNames: "content.js",
        inlineDynamicImports: true,
        assetFileNames: "assets/[name][extname]"
      }
    }
  }
});
