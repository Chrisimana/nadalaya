import { defineConfig } from "@playwright/test";

// E2E_BASE_URL diisi untuk menguji server yang sudah berjalan (mis. Docker); tanpa itu `npm run dev` dijalankan.
const ALAMAT = process.env.E2E_BASE_URL ?? "http://localhost:3000";
// Bawaan memakai Microsoft Edge yang terpasang; PW_CHANNEL="" memakai Chromium dari `npx playwright install chromium`.
const KANAL = process.env.PW_CHANNEL ?? "msedge";

export default defineConfig({
  testDir: "tests/e2e",
  outputDir: "tests/e2e/.hasil",
  workers: 1,
  timeout: 180_000,
  reporter: [["list"]],
  use: {
    baseURL: ALAMAT,
    channel: KANAL || undefined,
    locale: "id-ID",
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: "npm run dev", url: ALAMAT, reuseExistingServer: true, timeout: 180_000 },
});
