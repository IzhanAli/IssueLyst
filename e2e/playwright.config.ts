import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

/**
 * Self-contained Playwright config for the Projex e2e suite.
 *
 * Everything the suite needs lives inside this `e2e/` folder — delete the
 * folder (plus the two npm scripts and the @playwright/test devDependency)
 * and the app is exactly as it was. See e2e/README.md.
 */
const PORT = Number(process.env.PW_PORT ?? 3000);
const baseURL = process.env.PW_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: __dirname,
  globalSetup: path.join(__dirname, "global-setup.ts"),
  outputDir: path.join(__dirname, ".artifacts", "test-results"),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  workers: process.env.CI ? 2 : 4,
  retries: process.env.CI ? 2 : 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [
    ["list"],
    ["html", { outputFolder: path.join(__dirname, ".artifacts", "report"), open: "never" }],
  ],
  use: {
    baseURL,
    colorScheme: "light",
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 45_000,
  },
  // Uses the Google Chrome already installed on the machine (`channel: "chrome"`)
  // instead of downloading Playwright's own Chromium build.
  projects: [{ name: "chrome", use: { ...devices["Desktop Chrome"], channel: "chrome" } }],
  // Reuses an already-running `npm run dev`; starts one otherwise.
  // Set PW_BASE_URL to point the suite at a server you manage yourself.
  webServer: process.env.PW_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        cwd: path.join(__dirname, ".."),
        url: baseURL,
        reuseExistingServer: true,
        timeout: 180_000,
      },
});
