import { expect, test } from "@playwright/test";

// NFR-02: halaman utama termuat ≤ 3 detik pada koneksi 10 Mbps.
// Batas hanya ditegakkan terhadap build produksi (E2E_BASE_URL); di mode pengembangan waktu hanya dicatat.
const BATAS_MS = 3000;
const PRODUKSI = !!process.env.E2E_BASE_URL;

test("waktu muat beranda pada 10 Mbps", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Pembatasan jaringan memakai protokol DevTools Chromium/Edge.");

  // Pemanasan agar kompilasi halaman di mode pengembangan tidak ikut terukur.
  await page.goto("/", { waitUntil: "load" });

  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 40,
    downloadThroughput: (10 * 1024 * 1024) / 8,
    uploadThroughput: (5 * 1024 * 1024) / 8,
  });

  await page.goto("/", { waitUntil: "load" });
  const ms = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    return Math.round(nav.loadEventEnd - nav.startTime);
  });
  test.info().annotations.push({ type: "waktu muat", description: `${ms} ms (${PRODUKSI ? "produksi" : "pengembangan"})` });
  console.info(`[NFR-02] beranda termuat dalam ${ms} ms (${PRODUKSI ? "produksi" : "pengembangan"})`);

  if (PRODUKSI) expect(ms).toBeLessThanOrEqual(BATAS_MS);
});
