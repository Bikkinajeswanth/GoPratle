import { defineConfig, devices } from "@playwright/test";

/*
 * End-to-end tests drive the real UI against the real Express API and a
 * throwaway MongoDB (backend/scripts/e2e-server.ts). Uses the locally installed
 * Google Chrome by default; set PW_CHANNEL=msedge for Edge, or run
 * `npx playwright install chromium` and set PW_CHANNEL= (empty) for bundled Chromium.
 */
const API_PORT = 4100;
const WEB_PORT = 3100;
const channel = process.env.PW_CHANNEL ?? "chrome";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], ...(channel ? { channel } : {}) },
      grepInvert: /@mobile/,
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], ...(channel ? { channel } : {}) },
      grep: /@mobile/,
    },
  ],
  webServer: [
    {
      command: "npm --prefix ../backend run e2e:server",
      url: `http://localhost:${API_PORT}/api/health`,
      reuseExistingServer: false,
      timeout: 180_000,
      env: { E2E_API_PORT: String(API_PORT), E2E_FRONTEND_URL: `http://localhost:${WEB_PORT}` },
    },
    {
      command: `npx next dev --port ${WEB_PORT}`,
      url: `http://localhost:${WEB_PORT}`,
      reuseExistingServer: false,
      timeout: 180_000,
      env: { NEXT_PUBLIC_API_URL: `http://localhost:${API_PORT}`, NEXT_DIST_DIR: ".next-e2e" },
    },
  ],
});
