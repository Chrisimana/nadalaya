// Menyalin font musik VexFlow (yang di paket tertanam sebagai data URL) ke public/fonts/vexflow
// agar disajikan dari server sendiri. Jalankan ulang setelah memperbarui paket vexflow.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const akar = join(dirname(fileURLToPath(import.meta.url)), "..");
const sumber = join(akar, "node_modules", "vexflow", "build", "esm", "src", "fonts");
const tujuan = join(akar, "public", "fonts", "vexflow");

const FONT = [
  { modul: "bravura.js", ekspor: "Bravura", berkas: "bravura.woff2" },
  { modul: "academico.js", ekspor: "Academico", berkas: "academico.woff2" },
  { modul: "academicobold.js", ekspor: "AcademicoBold", berkas: "academico-bold.woff2" },
];

mkdirSync(tujuan, { recursive: true });
for (const f of FONT) {
  const dataUrl = (await import(pathToFileURL(join(sumber, f.modul)).href))[f.ekspor];
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const isi = Buffer.from(base64, "base64");
  if (isi.subarray(0, 4).toString() !== "wOF2") throw new Error(`${f.modul} bukan WOFF2`);
  writeFileSync(join(tujuan, f.berkas), isi);
  console.log(`${f.berkas}: ${(isi.length / 1024).toFixed(0)} KB`);
}
