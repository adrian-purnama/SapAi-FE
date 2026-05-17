import type { Metadata } from "next";
import Link from "next/link";

import { buildPageMetadata } from "@/lib/site-metadata";

type PageProps = { params: Promise<{ apiKeyId: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  await params;
  return buildPageMetadata({
    title: "Embed URL moved",
    description: "This embed URL format is no longer supported.",
    noIndex: true,
  });
}

export default async function LegacyEmbedByApiKeyPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-4 p-6 text-zinc-800">
      <h1 className="text-xl font-semibold text-zinc-900">This embed link is outdated</h1>
      <p className="text-sm leading-relaxed text-zinc-600">
        Public embed no longer uses the project id in the URL. Open your project in the dashboard, go to the FAQ /
        knowledge section, generate an <strong>embed token</strong>, turn <strong>Embed active</strong> on, then copy
        the new page URL or iframe snippet (<code className="rounded bg-zinc-100 px-1 font-mono text-xs">/embed/t/…</code>
        ).
      </p>
      <Link
        href="/dashboard"
        className="inline-flex w-fit items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
      >
        Go to dashboard
      </Link>
    </div>
  );
}
