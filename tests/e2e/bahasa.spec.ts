import { expect, test } from "@playwright/test";
import { HALAMAN_PUBLIK } from "./halaman";

// NFR-11: antarmuka berbahasa Indonesia. Pemeriksaan kasar terhadap istilah bawaan berbahasa Inggris.
const ISTILAH_INGGRIS = /\b(Loading|Submit|Sign in|Sign up|Log in|Login|Password|Email address|Forgot|Something went wrong|Not found)\b/;

for (const { jalur, nama } of HALAMAN_PUBLIK) {
  test(`bahasa: ${nama}`, async ({ page }) => {
    await page.goto(jalur, { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute("lang", "id");

    const teks = await page.locator("body").innerText();
    const atribut = await page.evaluate(() =>
      [...document.querySelectorAll("[placeholder], [aria-label], [title]")]
        .map((el) => [el.getAttribute("placeholder"), el.getAttribute("aria-label"), el.getAttribute("title")].join(" "))
        .join(" "),
    );
    expect(`${teks}\n${atribut}`).not.toMatch(ISTILAH_INGGRIS);
  });
}
