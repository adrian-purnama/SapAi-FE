import type { MetadataRoute } from "next";

import { getSiteOrigin } from "@/lib/site-metadata";

export default function robots(): MetadataRoute.Robots {
  const origin = getSiteOrigin();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/dashboard", "/account", "/login", "/register", "/forgot-password", "/reset-password"],
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}
