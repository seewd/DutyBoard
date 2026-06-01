/// <reference types="node" />

import { defineConfig } from "vite";
import path from "path";
import fs from "fs";

function loadDotEnv() {
  const envPath = path.resolve(__dirname, ".env");
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, "utf-8");
  const env: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
  }
  return env;
}

const dotenv = loadDotEnv();
const host = dotenv.TAURI_DEV_HOST;

export default defineConfig({
  clearScreen: false,  // prevent Vite from obscuring rust errors
  root: "src",
  define: {
    "import.meta.env.VITE_YUQUE_TOKEN": JSON.stringify(dotenv.VITE_YUQUE_TOKEN ?? ""),
  },
  build: {
    target: "esnext",
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "src/index.html"),
        setting: path.resolve(__dirname, "src/setting.html"),
      },
    },
  },
  server: {
    port: 1420,
    strictPort: true,
    host: host || "0.0.0.0",
    hmr: host
      ? {
        protocol: "ws",
        host,
        port: 1421,
      }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
});
