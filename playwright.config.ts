import { defineConfig } from "@playwright/test";

// BASE_URL (atau E2E_BASE_URL) diisi untuk menguji server yang sudah berjalan, mis. Docker atau situs produksi;
// tanpa itu `npm run dev` dijalankan di localhost.
const ALAMAT_LUAR = process.env.BASE_URL || process.env.E2E_BASE_URL;
const ALAMAT = ALAMAT_LUAR ?? "http://localhost:3000";
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
  webServer: ALAMAT_LUAR
    ? undefined
    : { command: "npm run dev", url: ALAMAT, reuseExistingServer: true, timeout: 180_000 },
});
