import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Frame } from "lucide-react";

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
    <div className="flex h-full min-h-0 items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-xl shadow-zinc-900/5 sm:p-8">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
          <Frame className="h-5 w-5" aria-hidden />
        </span>
        <h1 className="mt-4 text-xl font-semibold tracking-tight text-zinc-900">This embed link is outdated</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          Public embed no longer uses the project id in the URL. Open your project in the dashboard, go to the FAQ /
          knowledge section, generate an <strong className="font-medium text-zinc-800">embed token</strong>, turn{" "}
          <strong className="font-medium text-zinc-800">Embed active</strong> on, then copy the new page URL or iframe
          snippet (<code className="rounded bg-zinc-100 px-1 font-mono text-xs">/embed/t/…</code>).
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 sm:w-auto"
        >
          Go to dashboard
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
