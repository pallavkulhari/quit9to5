import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig(async () => {
  const plugins = [
    react(),
    runtimeErrorOverlay(),
  ];

  // Replit-only plugin (safe to keep)
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
  ) {
    const { cartographer } = await import(
      "@replit/vite-plugin-cartographer"
    );
    plugins.push(cartographer());
  }

  return {
    plugins,

    resolve: {
      alias: {
        "@": path.join(process.cwd(), "client", "src"),
        "@shared": path.join(process.cwd(), "shared"),
        "@assets": path.join(process.cwd(), "attached_assets"),
      },
    },

    root: path.join(process.cwd(), "client"),

    build: {
      outDir: path.join(process.cwd(), "dist", "public"),
      emptyOutDir: true,
    },

    server: {
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});
