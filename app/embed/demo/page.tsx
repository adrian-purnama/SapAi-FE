import type { Metadata } from "next";

import { fetchEmbedAccent } from "@/lib/embed-accent";
import { parseDemoSiteUrl } from "@/lib/embed-demo";

import { EmbedSiteDemo } from "./EmbedSiteDemo";

export const metadata: Metadata = {
  title: "Embed demo",
  robots: { index: false, follow: false },
};

type PageProps = { searchParams: Promise<{ site?: string; token?: string }> };

export default async function EmbedDemoPage({ searchParams }: PageProps) {
  const { site: siteRaw, token: tokenRaw } = await searchParams;
  const token = tokenRaw?.trim() ?? "";
  const siteParsed = siteRaw?.trim() ? parseDemoSiteUrl(siteRaw) : null;

  if (!token || !siteParsed?.ok) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center gap-2 px-6 text-center text-sm text-zinc-600">
        <p className="font-medium text-zinc-900">Embed site demo</p>
        <p>
          Add <code className="rounded bg-zinc-100 px-1 font-mono text-xs">site</code> and{" "}
          <code className="rounded bg-zinc-100 px-1 font-mono text-xs">token</code> to the URL, or generate a link from
          your project&apos;s <strong>Sites &amp; copy</strong> tab.
        </p>
        {siteRaw?.trim() && siteParsed && !siteParsed.ok ? (
          <p className="text-xs text-amber-800">{siteParsed.message}</p>
        ) : null}
      </div>
    );
  }

  const accent = await fetchEmbedAccent(token);

  return <EmbedSiteDemo siteUrl={siteParsed.url} token={token} accent={accent} />;
}
