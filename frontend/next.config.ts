import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Playwright suite sets NEXT_DIST_DIR so its dev server can run alongside your own `npm run dev`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  turbopack: {
    // Pin the workspace root to this app so stray lockfiles in parent folders are ignored.
    root: path.join(__dirname),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
