import { defineConfig, loadEnv } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  // "" loads every variable, not just VITE_*. Only the *boolean* below crosses
  // into the bundle — the connection string itself never does.
  const env = loadEnv(mode, process.cwd(), "");

  return {
    // 3100 keeps this repo clear of projex-app on 3000, so both can run at once.
    // strictPort matters for the e2e suite: drifting to another port would point
    // its baseURL at whatever else is listening.
    server: { port: 3100, strictPort: true },
    resolve: { tsconfigPaths: true },
    define: {
      // Lets the store pick its persistence without asking the server first.
      // Baked at build time: a DATABASE_URL that only appears at runtime will
      // leave the app on localStorage.
      __DB_CONFIGURED__: JSON.stringify(Boolean(env.DATABASE_URL)),
    },
    // Nitro produces the deployable server output. Vercel has zero-config
    // detection for Start + Nitro, so there is no build command to set there.
    plugins: [tailwindcss(), tanstackStart(), nitro(), viteReact()],
  };
});
