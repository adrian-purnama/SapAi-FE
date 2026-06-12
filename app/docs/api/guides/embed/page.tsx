import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Frame, KeyRound, Palette, Sparkles } from "lucide-react";

import { DocsCallout } from "@/app/docs/components/DocsCallout";
import { DocsPageHeader } from "@/app/docs/components/DocsPageHeader";

export const metadata: Metadata = {
  title: "Embed your FAQ assistant SapAi",
  description:
    "Step-by-step: add a branded FAQ chat widget to your website from the SapAi dashboard knowledge, appearance, allowed sites, and copy-paste embed code.",
};

export default function EmbedDashboardGuidePage() {
  return (
    <div className="space-y-12">
      <DocsPageHeader
        title="Put your Chat assistant on any website"
        description={
          <>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-zinc-700">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              No coding required to get started
            </span>
            <span className="mt-2 block">
              Give visitors a fixed chat panel that answers from{" "}
              <strong className="font-medium text-zinc-800">your</strong> knowledge. Visitors use a safe{" "}
              <strong className="font-medium text-zinc-800">embed token</strong>, not your secret API key.
            </span>
          </>
        }
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <Frame className="h-5 w-5 text-sky-700" aria-hidden />
          <p className="mt-3 text-sm font-semibold text-zinc-900">Fixed widget</p>
          <p className="mt-1 text-sm leading-relaxed text-zinc-600">
            Bottom-right iframe, always visible, no floating button to wire up.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <Palette className="h-5 w-5 text-violet-700" aria-hidden />
          <p className="mt-3 text-sm font-semibold text-zinc-900">On-brand</p>
          <p className="mt-1 text-sm leading-relaxed text-zinc-600">
            Name, greeting, accent color, avatar, disclaimer, and one optional link.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <KeyRound className="h-5 w-5 text-emerald-700" aria-hidden />
          <p className="mt-3 text-sm font-semibold text-zinc-900">Your domains</p>
          <p className="mt-1 text-sm leading-relaxed text-zinc-600">
            Allow only the sites that may iframe the widget, everyone else is blocked.
          </p>
        </div>
      </section>

      <DocsCallout variant="warning" title="Before you start">
        <ul className="space-y-2">
          <li>
            <strong className="font-medium">Plan:</strong> Public embed needs Pro or Scale. On Free you will see upgrade
            messaging instead of full controls.
          </li>
          <li>
            <strong className="font-medium">Sign in</strong> and open{" "}
            <Link href="/dashboard" className="font-medium underline underline-offset-2 hover:text-amber-900">
              Dashboard
            </Link>
            . Each project is one API key — pick the project whose knowledge the widget should use.
          </li>
          <li>
            <strong className="font-medium">Roughly 10–15 minutes</strong> for first setup: upload docs, generate token,
            paste iframe on your site.
          </li>
        </ul>
      </DocsCallout>

      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Setup in four steps</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Everything lives on your project page under the <strong className="font-medium text-zinc-800">RAG / FAQ</strong>{" "}
            tab.
          </p>
        </div>

        <ol className="space-y-10">
          <li className="relative border-l-2 border-zinc-200 pl-8">
            <span
              className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white"
              aria-hidden
            >
              1
            </span>
            <h3 className="font-semibold text-zinc-900">Open your project</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">
              <Link href="/dashboard" className="font-medium text-sky-800 underline-offset-2 hover:underline">
                Dashboard
              </Link>{" "}
              → click your project → open the <strong className="text-zinc-800">RAG / FAQ</strong> tab.
            </p>
          </li>

          <li className="relative border-l-2 border-zinc-200 pl-8">
            <span
              className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white"
              aria-hidden
            >
              2
            </span>
            <h3 className="font-semibold text-zinc-900">Teach the assistant</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">
              <strong className="text-zinc-800">Knowledge</strong> — upload Markdown files with the content visitors
              should ask about. <strong className="text-zinc-800">Categories</strong> — optional labels to organize
              answers.
            </p>
          </li>

          <li className="relative border-l-2 border-zinc-200 pl-8">
            <span
              className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white"
              aria-hidden
            >
              3
            </span>
            <h3 className="font-semibold text-zinc-900">Turn on the embed and make it yours</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 px-4 py-3">
                <p className="font-semibold text-zinc-900">Setup</p>
                <p className="mt-1 leading-relaxed text-zinc-600">
                  Generate token, enable Embed active, rotate token when needed.
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 px-4 py-3">
                <p className="font-semibold text-zinc-900">Widget look</p>
                <p className="mt-1 leading-relaxed text-zinc-600">
                  Name, greeting, accent color, profile picture, and optional badge settings.
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 px-4 py-3">
                <p className="font-semibold text-zinc-900">Sites &amp; copy</p>
                <p className="mt-1 leading-relaxed text-zinc-600">
                  Add allowed parent origins, then copy the iframe HTML snippet.
                </p>
              </div>
            </div>
            <DocsCallout variant="info" className="mt-4">
              The <strong className="font-medium">embed token</strong> (
              <code className="font-mono text-xs">et_…</code>) is safe in the browser. It is not your secret{" "}
              <code className="font-mono text-xs">sapai_sk_</code> server key.
            </DocsCallout>
          </li>

          <li className="relative border-l-2 border-zinc-200 pl-8">
            <span
              className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white"
              aria-hidden
            >
              4
            </span>
            <h3 className="font-semibold text-zinc-900">Preview, paste, and go live</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">
              Use Live preview on Sites &amp; copy, then paste the iframe before{" "}
              <code className="font-mono text-xs">&lt;/body&gt;</code> on your site.
            </p>
            <p className="mt-4">
              <Link
                href="/docs/api/server/embed"
                className="inline-flex items-center gap-1 text-sm font-medium text-sky-800 underline-offset-2 hover:underline"
              >
                Open embed API reference
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </p>
          </li>
        </ol>
      </section>

      <DocsCallout variant="tip" title="Launch checklist">
        <ul className="space-y-1.5">
          <li>At least one .md knowledge file processed</li>
          <li>Embed token generated and Embed active is on</li>
          <li>Production site origin saved under parent origins</li>
          <li>Iframe pasted on your site; widget answers a real question</li>
        </ul>
      </DocsCallout>

      <p className="text-sm text-zinc-500">
        <Link href="/docs/api" className="font-medium text-zinc-800 hover:underline">
          ← API documentation home
        </Link>
      </p>
    </div>
  );
}
