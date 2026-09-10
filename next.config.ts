import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Pin the workspace root so Next doesn't pick up a stray lockfile in $HOME.
  turbopack: { root },
};

export default nextConfig;
