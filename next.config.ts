import type { NextConfig } from "next";

const produksi = process.env.NODE_ENV === "production";
// HSTS dan upgrade-insecure-requests hanya untuk produksi HTTPS, bukan Docker di localhost.
const https = produksi && (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://");
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

const csp = [
  "default-src 'self'",
  // Skrip inline Next.js; PPR tidak mendukung CSP berbasis nonce.
  `script-src 'self' 'unsafe-inline' blob:${produksi ? "" : " 'unsafe-eval'"}`,
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

const headerKeamanan = [
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

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: headerKeamanan }];
  },
};

export default nextConfig;
