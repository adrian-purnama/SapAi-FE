import type { MetadataRoute } from "next";

import { getAllPostSlugs } from "@/app/blog/posts";
import { getSiteOrigin } from "@/lib/site-metadata";

const PRICING_TIERS = ["free", "pro", "scale"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getSiteOrigin();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${origin}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${origin}/pricing`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${origin}/docs/api`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${origin}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
  ];

  const pricingRoutes: MetadataRoute.Sitemap = PRICING_TIERS.map((tier) => ({
    url: `${origin}/pricing/${tier}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const blogRoutes: MetadataRoute.Sitemap = getAllPostSlugs().map((slug) => ({
    url: `${origin}/blog/${slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...pricingRoutes, ...blogRoutes];
}
