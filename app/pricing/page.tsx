import type { Metadata } from "next";
import Link from "next/link";
import type React from "react";
import { Check, Crown, Gauge, Layers, Sparkles, X } from "lucide-react";

import { buildPageMetadata } from "@/lib/site-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "Pricing",
    description:
      "Compare Free, Pro, and Scale: Markdown RAG knowledge, vector search, usage analytics, public embed widget, and priority processing.",
    path: "/pricing",
  });
}

type Tier = {
  id: "free" | "pro" | "scale";
  name: string;
  price: string;
  priceNote?: string;
  tagline: string;
  bullets: string[];
  cta: string;
  badge?: string;
  accent: "zinc" | "violet" | "amber";
  image: string;
};

const BENEFITS: Array<{ title: string; body: string; icon: React.ComponentType<{ className?: string }> }> = [
  {
    title: "RAG that stays fast",
    body: "Upload Markdown knowledge, we handle chunking and vector search — storage included on every plan.",
    icon: Layers,
  },
  {
    title: "Queues that don’t break",
    body: "Unlimited queue means you never hard-fail a spike. Priority makes it feel instant when you upgrade.",
    icon: Gauge,
  },
  {
    title: "Embed on your site",
    body: "Pro and Scale add a branded FAQ chat widget (iframe + token) so visitors get answers without you building a UI.",
    icon: Sparkles,
  },
];

const TIERS: Tier[] = [
  {
    id: "free",
    name: "Free",
    price: "0",
    priceNote: "forever",
    tagline: "Prove the API and FAQ RAG on one project — upgrade when you need embed or analytics.",
    bullets: [
      "1 API key",
      "Chat + RAG via API · unlimited queue",
      "10 API requests / minute (per key)",
      "700 characters per message",
      "1 Markdown (.md) knowledge file per project · 1 MB max",
      "Vector search storage included",
      "Usage history: 1 day",
    ],
    cta: "Start free",
    badge: "Just Do It",
    accent: "zinc",
    image: "/pricing/free.png",
  },
  {
    id: "pro",
    name: "Pro",
    price: "150k",
    priceNote: "per month",
    tagline: "Ship multiple projects, faster runs, website embed, and months of RAG insights.",
    bullets: [
      "3 API keys (projects)",
      "Priority processing",
      "120 API requests / minute (per key)",
      "3,000 characters per message",
      "5 Markdown (.md) files per project · 10 MB each",
      "Vector search storage included",
      "Usage & RAG insights — 3 months",
      "Public embed widget (iframe) on your site",
      "Fixed “Provided by SapAi” badge on embed",
    ],
    cta: "Upgrade to Pro",
    badge: "Best value",
    accent: "violet",
    image: "/pricing/pro.png",
  },
  {
    id: "scale",
    name: "Scale",
    price: "399k",
    priceNote: "per month",
    tagline: "Maximum projects, knowledge, retention, and full control of embed branding.",
    bullets: [
      "10 API keys (projects)",
      "Priority processing",
      "200 API requests / minute (per key)",
      "10,000 characters per message",
      "10 Markdown (.md) files per project · 15 MB each",
      "Vector search storage included",
      "Usage & RAG insights — 12 months",
      "Public embed widget (iframe) on your site",
      "Custom embed badge & AI disclaimer",
    ],
    cta: "Upgrade to Scale",
    badge: "Serious Stuff",
    accent: "amber",
    image: "/pricing/scale.png",
  },
];

function ComparePlanCell({ value }: { value: string }) {
  if (value === "—") {
    return (
      <span className="inline-flex text-zinc-400" title="Not included" aria-label="Not included">
        <X className="h-4 w-4" strokeWidth={2.25} aria-hidden />
      </span>
    );
  }
  if (value === "Yes" || value === "Included") {
    return (
      <span className="inline-flex text-emerald-600" title={value} aria-label={value}>
        <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
      </span>
    );
  }
  return <span>{value}</span>;
}

export default function PricingPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12">
      <section className="mx-auto max-w-3xl text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
          <Crown className="h-3.5 w-3.5 text-violet-600" aria-hidden />
          Pricing for projects that ship
        </div>
        <div className="relative isolate mt-4">
          {/* Gradient BEHIND the headline text (not a full-page banner). */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-28 w-[min(640px,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-linear-to-r from-violet-200/30 via-fuchsia-200/20 to-amber-200/25 blur-2xl"
            aria-hidden
          />
          <h1 className="relative z-10 text-4xl font-semibold tracking-tight text-zinc-950 md:text-5xl">
            <span className="inline-block px-3 py-1.5">
              Turn your knowledge base into a growth engine.
            </span>
          </h1>

          <p className="mt-4 text-sm leading-relaxed text-zinc-600">
            Upgrade to handle more projects, upload larger knowledge bases, unlock advanced analytics, and deliver faster,
            more accurate AI answers that reduce support load and improve customer trust.
          </p>
        </div>
      </section>

      <div className="mt-10 grid auto-rows-fr items-stretch gap-6 md:grid-cols-3">
        {TIERS.map((tier) => {
          const ring =
            tier.accent === "violet"
              ? "border-violet-200 bg-white"
              : tier.accent === "amber"
                ? "border-amber-200 bg-gradient-to-b from-amber-50 to-white"
                : "border-zinc-200 bg-white";
          const cta =
            tier.accent === "violet"
              ? "bg-violet-600 text-white hover:bg-violet-700"
              : tier.accent === "amber"
                ? "bg-amber-600 text-white hover:bg-amber-700"
                : "bg-zinc-900 text-white hover:bg-zinc-800";

          const recommendGlow =
            tier.id === "pro"
              ? "before:absolute before:-inset-1 before:-z-10 before:rounded-[18px] before:bg-linear-to-r before:from-violet-200/40 before:via-fuchsia-200/25 before:to-amber-200/30 before:blur-xl before:content-['']"
              : "";

          return (
            <div
              key={tier.id}
              className={
                "group relative isolate flex h-full flex-col rounded-2xl border p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md " +
                ring +
                " " +
                recommendGlow
              }
            >
              <img src={tier.image} alt={tier.name} className="w-30 h-auto" />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-500">Plan</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold text-zinc-950">{tier.name}</h2>
                    {tier.badge ? (
                      <span className="rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-xs font-semibold text-zinc-700">
                        {tier.badge}
                      </span>
                    ) : null}
                  </div>
                </div>
                <Link
                  href={`/pricing/${tier.id}`}
                  className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
                >
                  Details
                </Link>
              </div>

              <p className="mt-4 text-4xl font-semibold tracking-tight text-zinc-950">
                {tier.price === "0" ? "Free" : tier.price}
                {tier.priceNote ? (
                  <span className="ml-2 text-base font-medium text-zinc-500">{tier.priceNote}</span>
                ) : null}
              </p>
              <p className="mt-2 text-sm text-zinc-600">{tier.tagline}</p>

              <ul className="mt-6 flex-1 space-y-2 text-sm text-zinc-700">
                {tier.bullets.map((b) => (
                  <li key={b} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-300" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Link
                  href="/register"
                  className={
                    "mt-auto inline-flex h-11 w-full items-center justify-center rounded-lg text-sm font-semibold transition " +
                    cta
                  }
                >
                  {tier.cta}
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <section className="mt-12 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-6 py-5">
          <h2 className="text-lg font-semibold text-zinc-900">Compare plans</h2>
          <p className="mt-1 text-sm text-zinc-600">Simple limits designed to keep the API fast and predictable.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-6 py-3">Feature</th>
                <th className="px-6 py-3">Free</th>
                <th className="px-6 py-3">Pro</th>
                <th className="px-6 py-3">Scale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {[
                ["API keys (total)", "1", "3", "10"],
                ["Chat + RAG via API", "Included", "Included", "Included"],
                ["Queue", "Unlimited", "Unlimited", "Unlimited"],
                ["Priority processing", "—", "Yes", "Yes"],
                ["API requests / minute (per key)", "10", "120", "200"],
                ["Max characters per message", "700", "3,000", "10,000"],
                ["Knowledge files / project", "1", "5", "10"],
                ["File type", "Markdown (.md)", "Markdown (.md)", "Markdown (.md)"],
                ["Max file size", "1 MB", "10 MB", "15 MB"],
                ["Vector search storage", "Included", "Included", "Included"],
                ["Usage & RAG insights", "1 day", "3 months", "12 months"],
                ["Public embed widget", "—", "Included", "Included"],
                ["Embed badge & disclaimer", "—", "Fixed SapAi badge", "Fully customizable"],
              ].map(([k, a, b, c]) => (
                <tr key={k}>
                  <td className="px-6 py-3 font-medium text-zinc-900">{k}</td>
                  <td className="px-6 py-3 text-zinc-700">
                    <ComparePlanCell value={a} />
                  </td>
                  <td className="px-6 py-3 text-zinc-700">
                    <ComparePlanCell value={b} />
                  </td>
                  <td className="px-6 py-3 text-zinc-700">
                    <ComparePlanCell value={c} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

