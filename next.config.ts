import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    // AVIF first (smallest), WebP fallback — both self-optimized by Next's
    // built-in image API, no source-file changes needed.
    formats: ["image/avif", "image/webp"],
    // 60 lets the hero render (mostly hidden behind a dark scrim) ship at a
    // smaller byte size; 75 stays the default for everything else.
    qualities: [60, 75],
  },
};

export default nextConfig;
