import type { NextConfig } from "next";
import { HEADER_KEAMANAN } from "./lib/headerKeamanan";

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
    return [{ source: "/:path*", headers: HEADER_KEAMANAN }];
  },
};

export default nextConfig;
