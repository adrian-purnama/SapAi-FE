import type { Metadata } from "next";

import SapAiLandingPage from "@/app/components/landing/SapAiLandingPage";
import { getPublicAppConfigForMetadata } from "@/lib/app-config-public";
import { buildPageMetadata, getSiteOrigin } from "@/lib/site-metadata";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getPublicAppConfigForMetadata();
  return buildPageMetadata({
    title: config.appName,
    description: `Launch an AI chatbot for your site with ${config.appName}. RAG, API keys, docs, and a dashboard in one place.`,
    path: "/",
  });
}

export default async function LandingPage() {
  const config = await getPublicAppConfigForMetadata();
  const siteUrl = getSiteOrigin();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: config.appName,
    url: siteUrl,
    description: `AI chatbot platform with dashboard, docs, and API access.`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SapAiLandingPage />
    </>
  );
}
