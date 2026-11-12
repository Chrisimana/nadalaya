// Header keamanan untuk semua respons. Dipakai next.config.ts dan pengalihan di proxy.ts,
// karena di Netlify header next.config tidak ikut pada respons pengalihan dari proxy.

const produksi = process.env.NODE_ENV === "production";
// HSTS dan upgrade-insecure-requests hanya untuk produksi HTTPS, bukan Docker di localhost.
const https = produksi && (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://");
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

const csp = [
  "default-src 'self'",
  // Skrip inline Next.js; PPR tidak mendukung CSP berbasis nonce.
  // 'wasm-unsafe-eval' hanya untuk WebAssembly (dicoba pustaka long milik TensorFlow.js), bukan eval JavaScript.
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob:${produksi ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self' ${supabase}${produksi ? "" : " ws:"}`.trim(),
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(https ? ["upgrade-insecure-requests"] : []),
].join("; ");

export const HEADER_KEAMANAN: { key: string; value: string }[] = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "microphone=(self), camera=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  ...(https ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }] : []),
];
