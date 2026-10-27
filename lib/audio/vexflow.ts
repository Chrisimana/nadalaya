// Font musik disajikan dari /fonts/vexflow (lihat scripts/salin-font-vexflow.mjs), bukan data URL atau CDN,
// agar sesuai CSP font-src 'self'.
const FONT: { nama: string; url: string; deskriptor: Record<string, string> }[] = [
  { nama: "Bravura", url: "/fonts/vexflow/bravura.woff2", deskriptor: { display: "block" } },
  { nama: "Academico", url: "/fonts/vexflow/academico.woff2", deskriptor: { display: "swap" } },
  { nama: "Academico", url: "/fonts/vexflow/academico-bold.woff2", deskriptor: { display: "swap", weight: "bold" } },
];

type ModulVexflow = typeof import("vexflow/core");

let siap: Promise<ModulVexflow> | null = null;

/** VexFlow beserta fontnya; selesai hanya setelah semua font benar-benar termuat. */
export function muatVexflow(): Promise<ModulVexflow> {
  siap ??= (async () => {
    const VF = await import("vexflow/core");
    await Promise.all(FONT.map((f) => VF.Font.load(f.nama, f.url, f.deskriptor)));
    VF.VexFlow.setFonts("Bravura", "Academico");
    return VF;
  })().catch((err) => {
    siap = null;
    throw err;
  });
  return siap;
}
