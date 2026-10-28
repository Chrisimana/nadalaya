import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { HALAMAN_PUBLIK } from "./halaman";

// NFR-13: tanpa scroll horizontal pada lebar 360–1920 px.
const LEBAR = [360, 768, 1280, 1920];
const FOLDER = join(process.cwd(), "tests", "e2e", "tangkapan");

test.beforeAll(() => mkdirSync(FOLDER, { recursive: true }));

for (const { jalur, nama } of HALAMAN_PUBLIK) {
  test(`responsif: ${nama}`, async ({ page }) => {
    for (const lebar of LEBAR) {
      await page.setViewportSize({ width: lebar, height: 900 });
      await page.goto(jalur, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);

      const ukuran = await page.evaluate(() => {
        const lebarDokumen = document.documentElement.scrollWidth;
        const lebarLayar = document.documentElement.clientWidth;
        // Elemen yang melewati tepi kanan, untuk membantu mencari penyebab.
        const pelanggar = [...document.querySelectorAll("body *")]
          .filter((el) => el.getBoundingClientRect().right > lebarLayar + 1)
          .slice(0, 5)
          .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).split(" ").slice(0, 3).join(".")}`);
        return { lebarDokumen, lebarLayar, pelanggar };
      });

      await page.screenshot({ path: join(FOLDER, `${nama}-${lebar}.png`), fullPage: true });
      expect
        .soft(ukuran.lebarDokumen, `${jalur} @ ${lebar}px melebar: ${ukuran.pelanggar.join(", ")}`)
        .toBeLessThanOrEqual(ukuran.lebarLayar);
    }
  });
}
