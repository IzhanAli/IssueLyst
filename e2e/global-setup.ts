import type { FullConfig } from "@playwright/test";

/**
 * The Vite dev server transforms a route's modules the first time they are
 * requested, which can push a cold navigation past the assertion timeout. Warm
 * every route the suite uses once, up front, so the specs measure the app and
 * not the bundler.
 */
const PATHS = [
  "/login",
  "/app/project/engineering/list",
  "/app/project/engineering/board",
  "/app/project/engineering/issue/142",
  "/app/my-issues",
  "/app/inbox",
  "/app/home",
  "/app/whiteboards",
  "/app/settings",
  "/onboarding",
];

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL ?? "http://localhost:3100";
  for (const path of PATHS) {
    try {
      await fetch(new URL(path, baseURL), { redirect: "follow" });
    } catch {
      // The webServer fixture reports an unreachable server far better than we can.
    }
  }
}
