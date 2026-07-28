import type { MetadataRoute } from "next";

// Block all crawlers from the entire site — this project must not be indexed.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
