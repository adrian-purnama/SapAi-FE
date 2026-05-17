import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Frame, KeyRound, Palette, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Embed your FAQ assistant SapAi",
  description:
    "Step-by-step: add a branded FAQ chat widget to your website from the SapAi dashboard knowledge, appearance, allowed sites, and copy-paste embed code.",
};

export default function EmbedDashboardGuidePage() {
  return (
    <>
      <div className="max-w-2xl">
        <p className="inline-flex items-center gap-1 text-xs font-medium">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          No coding required to get started
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900">
          Put your Chat assistant on any website
        </h1>
        <p className="mt-3 text-base leading-relaxed text-zinc-600">
          Give visitors a fixed chat panel in the corner of your site that answers from{" "}
          <strong className="font-medium text-zinc-800">your</strong> knowledge, not a generic chatbot. You control the
          name, greeting, colors, and optional profile photo. Visitors use a safe{" "}
          <strong className="font-medium text-zinc-800">embed token</strong> (not your secret API key).
        </p>
        <p className="mt-3 text-sm text-zinc-600">
          Building a custom integration instead? See{" "}
          <Link href="/docs/api/server/embed" className="font-medium text-sky-800 underline-offset-2 hover:underline">
            Public embed API
          </Link>{" "}
          for HTTP routes and headers.
        </p>
      </div>

      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <Frame className="h-5 w-5 text-sky-700" aria-hidden />
          <p className="mt-2 text-sm font-semibold text-zinc-900">Fixed widget</p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-600">
            Bottom-right iframe, always visible, no floating button to wire up.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <Palette className="h-5 w-5 text-violet-700" aria-hidden />
          <p className="mt-2 text-sm font-semibold text-zinc-900">On-brand</p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-600">
            Name, greeting, accent color, avatar, disclaimer, and one optional link.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <KeyRound className="h-5 w-5 text-emerald-700" aria-hidden />
          <p className="mt-2 text-sm font-semibold text-zinc-900">Your domains</p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-600">
            Allow only the sites that may iframe the widget, everyone else is blocked.
          </p>
        </div>
      </section>

      <section className="mt-8 rounded-xl border border-amber-200/90 bg-amber-50/60 p-4">
        <h2 className="text-sm font-semibold text-amber-950">Before you start</h2>
        <ul className="mt-2 space-y-2 text-sm leading-relaxed text-amber-950/90">
          <li>
            <strong className="font-medium text-amber-950">Plan:</strong> Public embed needs{" "}
            <strong className="font-medium text-amber-950">Pro or Scale</strong>. On Free you will see upgrade messaging
            instead of full controls.
          </li>
          <li>
            <strong className="font-medium text-amber-950">Sign in</strong> and open{" "}
            <Link href="/dashboard" className="font-medium text-amber-950 underline underline-offset-2 hover:text-amber-900">
              Dashboard
            </Link>
            . Each project is one API key, pick the project whose knowledge the widget should use.
          </li>
          <li>
            <strong className="font-medium text-amber-950">Roughly 10–15 minutes</strong> for first setup: upload docs,
            generate token, paste iframe on your site.
          </li>
        </ul>
      </section>

      <section className="mt-10 max-w-2xl">
        <h2 className="text-lg font-semibold text-zinc-900">Setup in four steps</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Everything lives on your project page under the <strong className="font-medium text-zinc-800">RAG / FAQ</strong>{" "}
          tab.
        </p>

        <ol className="mt-6 space-y-8">
          <li className="relative pl-8">
            <span
              className="absolute left-0 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white"
              aria-hidden
            >
              1
            </span>
            <h3 className="font-semibold text-zinc-900">Open your project</h3>
            <p className="mt-1 text-sm leading-relaxed text-zinc-600">
              <Link href="/dashboard" className="font-medium text-sky-800 underline-offset-2 hover:underline">
                Dashboard
              </Link>{" "}
              → click your project → open the <strong className="text-zinc-800">RAG / FAQ</strong> tab. You will see four
              numbered steps: knowledge, categories, embed, and a test chat.
            </p>
          </li>

          <li className="relative pl-8">
            <span
              className="absolute left-0 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white"
              aria-hidden
            >
              2
            </span>
            <h3 className="font-semibold text-zinc-900">Teach the assistant (knowledge + categories)</h3>
            <p className="mt-1 text-sm leading-relaxed text-zinc-600">
              <strong className="text-zinc-800">Step 1 · Knowledge</strong> — upload Markdown (
              <code className="rounded bg-zinc-100 px-1 font-mono text-[11px]">.md</code>) files with the content visitors
              should ask about. Wait until processing finishes.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">
              <strong className="text-zinc-800">Step 2 · Categories</strong> — optional short labels (e.g. billing,
              shipping) to organize answers. Save when you are done.
            </p>
          </li>

          <li className="relative pl-8">
            <span
              className="absolute left-0 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white"
              aria-hidden
            >
              3
            </span>
            <h3 className="font-semibold text-zinc-900">Turn on the embed and make it yours</h3>
            <p className="mt-1 text-sm leading-relaxed text-zinc-600">
              Open <strong className="text-zinc-800">Step 3 · Public embed</strong>. Use the three tabs:
            </p>
            <div className="mt-3 space-y-3 text-sm">
              <div className="rounded-lg border border-zinc-200/90 bg-zinc-50/50 px-3 py-2.5">
                <p className="font-semibold text-zinc-900">Setup</p>
                <p className="mt-1 leading-relaxed text-zinc-600">
                  Click <strong className="text-zinc-800">Generate token</strong>, then enable{" "}
                  <strong className="text-zinc-800">Embed active</strong>. Use{" "}
                  <strong className="text-zinc-800">Rotate token</strong> anytime you need to revoke old links (old URLs
                  stop working).
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200/90 bg-zinc-50/50 px-3 py-2.5">
                <p className="font-semibold text-zinc-900">Widget look</p>
                <p className="mt-1 leading-relaxed text-zinc-600">
                  Set assistant name, first-open greeting, optional description (shown when the avatar is tapped),
                  accent color, and profile picture. On Scale you can customize the app badge and AI disclaimer when the
                  badge is on. Click <strong className="text-zinc-800">Save appearance</strong> when finished.
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200/90 bg-zinc-50/50 px-3 py-2.5">
                <p className="font-semibold text-zinc-900">Sites &amp; copy</p>
                <p className="mt-1 leading-relaxed text-zinc-600">
                  Add each website that may host the iframe as a parent origin (
                  <code className="rounded bg-zinc-100 px-1 font-mono text-[11px]">https://yoursite.com</code>, or
                  localhost for testing). Click <strong className="text-zinc-800">Save origins</strong>. Then copy the
                  hosted URL, token, or iframe HTML from{" "}
                  <strong className="text-zinc-800">Copy embed URL, token, or iframe HTML</strong>.
                </p>
              </div>
            </div>
            <p className="mt-3 rounded-lg border border-sky-200/80 bg-sky-50/50 px-3 py-2 text-xs leading-relaxed text-sky-950">
              The <strong className="font-medium">embed token</strong> (
              <code className="font-mono text-[11px]">et_…</code>) is safe to use in the browser. It is{" "}
              <strong className="font-medium">not</strong> your secret{" "}
              <code className="font-mono text-[11px]">sapai_sk_</code> server key.
            </p>
          </li>

          <li className="relative pl-8">
            <span
              className="absolute left-0 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white"
              aria-hidden
            >
              4
            </span>
            <h3 className="font-semibold text-zinc-900">Preview, paste, and go live</h3>
            <p className="mt-1 text-sm leading-relaxed text-zinc-600">
              On <strong className="text-zinc-800">Sites &amp; copy</strong>, when embed is active you get a{" "}
              <strong className="text-zinc-800">Live preview</strong> of the widget. Paste the iframe snippet before{" "}
              <code className="font-mono text-[11px]">&lt;/body&gt;</code> on your site.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">
              Optional: use <strong className="text-zinc-800">Step 4 · Debug RAG</strong> with your project API key to ask
              test questions before you share the embed with customers.
            </p>
            <p className="mt-3">
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

      <section className="mt-10 max-w-2xl rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-4">
        <h2 className="text-sm font-semibold text-emerald-950">Launch checklist</h2>
        <ul className="mt-2 space-y-1.5 text-sm text-emerald-950/90">
          <li className="flex gap-2">
            <span className="text-emerald-700" aria-hidden>
              ✓
            </span>
            At least one <code className="font-mono text-[11px]">.md</code> knowledge file processed
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-700" aria-hidden>
              ✓
            </span>
            Embed token generated and <strong className="font-medium">Embed active</strong> is on
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-700" aria-hidden>
              ✓
            </span>
            Production site origin saved under parent origins
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-700" aria-hidden>
              ✓
            </span>
            Iframe pasted on your site; widget loads and answers a real question
          </li>
        </ul>
      </section>

      <p className="mt-10 text-sm text-zinc-500">
        <Link href="/docs/api" className="font-medium text-zinc-800 hover:underline">
          ← API documentation home
        </Link>
      </p>
    </>
  );
}
