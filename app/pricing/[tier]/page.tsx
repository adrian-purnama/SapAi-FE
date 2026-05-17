import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, CheckCircle2, Sparkles, X } from "lucide-react";

import { buildPageMetadata } from "@/lib/site-metadata";

type TierId = "free" | "pro" | "scale";

const TIER_IDS = new Set<TierId>(["free", "pro", "scale"]);

function normalizeTierId(raw: string): TierId | null {
  const s = raw.trim().toLowerCase();
  return TIER_IDS.has(s as TierId) ? (s as TierId) : null;
}

function TierLimitValue({ value }: { value: string }) {
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

const TIER_CONTENT: Record<
  TierId,
  {
    name: string;
    image: string;
    price: string;
    priceNote: string;
    badge: string;
    description: string;
    cta: string;
    bullets: string[];
    limits: Array<{ label: string; value: string }>;
  }
> = {
  free: {
    name: "Free",
    image: "/pricing/free.png",
    price: "0",
    priceNote: "forever",
    badge: "Just Do It",
    description: "Prove the API and FAQ RAG on one project — upgrade when you need embed or analytics.",
    cta: "Start free",
    bullets: [
      "1 API key",
      "Chat + RAG via API · unlimited queue",
      "10 API requests / minute (per key)",
      "700 characters per message",
      "1 Markdown (.md) knowledge file per project · 1 MB max",
      "Vector search storage included",
      "Usage history: 1 day",
    ],
    limits: [
      { label: "API keys (total)", value: "1" },
      { label: "Chat + RAG via API", value: "Included" },
      { label: "Queue", value: "Unlimited" },
      { label: "Priority processing", value: "—" },
      { label: "API requests / minute (per key)", value: "10" },
      { label: "Max characters per message", value: "700" },
      { label: "Knowledge files / project", value: "1" },
      { label: "File type", value: "Markdown (.md)" },
      { label: "Max file size", value: "1 MB" },
      { label: "Vector search storage", value: "Included" },
      { label: "Usage & RAG insights", value: "1 day" },
      { label: "Public embed widget", value: "—" },
      { label: "Embed badge & disclaimer", value: "—" },
    ],
  },
  pro: {
    name: "Pro",
    image: "/pricing/pro.png",
    price: "150k",
    priceNote: "per month",
    badge: "Best value",
    description: "Ship multiple projects, faster runs, website embed, and months of RAG insights.",
    cta: "Upgrade to Pro",
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
    limits: [
      { label: "API keys (total)", value: "3" },
      { label: "Chat + RAG via API", value: "Included" },
      { label: "Queue", value: "Unlimited" },
      { label: "Priority processing", value: "Yes" },
      { label: "API requests / minute (per key)", value: "120" },
      { label: "Max characters per message", value: "3,000" },
      { label: "Knowledge files / project", value: "5" },
      { label: "File type", value: "Markdown (.md)" },
      { label: "Max file size", value: "10 MB" },
      { label: "Vector search storage", value: "Included" },
      { label: "Usage & RAG insights", value: "3 months" },
      { label: "Public embed widget", value: "Included" },
      { label: "Embed badge & disclaimer", value: "Fixed SapAi badge" },
    ],
  },
  scale: {
    name: "Scale",
    image: "/pricing/scale.png",
    price: "399k",
    priceNote: "per month",
    badge: "Serious Stuff",
    description: "Maximum projects, knowledge, retention, and full control of embed branding.",
    cta: "Upgrade to Scale",
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
    limits: [
      { label: "API keys (total)", value: "10" },
      { label: "Chat + RAG via API", value: "Included" },
      { label: "Queue", value: "Unlimited" },
      { label: "Priority processing", value: "Yes" },
      { label: "API requests / minute (per key)", value: "200" },
      { label: "Max characters per message", value: "10,000" },
      { label: "Knowledge files / project", value: "10" },
      { label: "File type", value: "Markdown (.md)" },
      { label: "Max file size", value: "15 MB" },
      { label: "Vector search storage", value: "Included" },
      { label: "Usage & RAG insights", value: "12 months" },
      { label: "Public embed widget", value: "Included" },
      { label: "Embed badge & disclaimer", value: "Fully customizable" },
    ],
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tier: string }>;
}): Promise<Metadata> {
  const { tier } = await params;
  const id = normalizeTierId(tier);
  const content = id ? TIER_CONTENT[id] : null;
  if (!content) {
    return buildPageMetadata({
      title: "Pricing tier not found",
      description: "This pricing tier does not exist.",
      path: `/pricing/${tier}`,
      noIndex: true,
    });
  }

  return buildPageMetadata({
    title: `${content.name} pricing`,
    description: content.description,
    path: `/pricing/${id}`,
  });
}

export default async function PricingTierPage({
  params,
}: {
  params: Promise<{ tier: string }>;
}) {
  const { tier } = await params;
  const id = normalizeTierId(tier);
  const content = id ? TIER_CONTENT[id] : null;
  const accent =
    id === "pro"
      ? "from-violet-50 via-white to-fuchsia-50"
      : id === "scale"
        ? "from-amber-50 via-white to-amber-100/40"
        : "from-zinc-50 via-white to-white";
  const cta =
    id === "pro"
      ? "bg-violet-600 text-white hover:bg-violet-700"
      : id === "scale"
        ? "bg-amber-600 text-white hover:bg-amber-700"
        : "bg-zinc-900 text-white hover:bg-zinc-800";

  if (!content || !id) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-semibold text-zinc-900">Pricing tier not found</h1>
        <p className="mt-2 text-zinc-600">This tier does not exist.</p>
        <Link href="/pricing" className="mt-6 inline-block text-sm text-zinc-700 hover:text-zinc-900">
          Back to pricing
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12">
      <Link href="/pricing" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
        ← Pricing
      </Link>

      <section
        className={[
          "relative mt-5 overflow-hidden rounded-3xl border border-zinc-200 bg-linear-to-br px-6 py-8 shadow-sm sm:px-7 sm:py-10",
          accent,
        ].join(" ")}
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-violet-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-amber-200/40 blur-3xl" />
        <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between md:gap-10">
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
              <Sparkles className="h-3.5 w-3.5 text-zinc-700" aria-hidden />
              {content.badge}
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-900">{content.name}</h1>
            <p className="mt-2 text-2xl font-semibold text-zinc-900">
              {content.price === "0" ? "Free" : content.price}{" "}
              <span className="text-base font-medium text-zinc-500">{content.priceNote}</span>
            </p>
            <p className="mt-3 max-w-2xl text-lg text-zinc-600">{content.description}</p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/register"
                className={[
                  "inline-flex h-11 items-center justify-center rounded-full px-7 text-sm font-semibold shadow-sm transition",
                  cta,
                ].join(" ")}
              >
                {content.cta}
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/docs/api"
                className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 bg-white px-7 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50"
              >
                Read API docs
              </Link>
            </div>
          </div>

          <div className="relative mx-auto flex w-full max-w-[220px] shrink-0 justify-center md:mx-0 md:max-w-[260px]">
            <Image
              src={content.image}
              alt=""
              width={260}
              height={260}
              className="h-auto w-full object-contain drop-shadow-sm"
              priority
            />
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-3 sm:grid-cols-2">
        {content.bullets.map((bullet) => (
          <div key={bullet} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-zinc-800" aria-hidden />
              <p className="text-sm font-medium leading-snug text-zinc-800">{bullet}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-6 py-5">
          <h2 className="text-lg font-semibold text-zinc-900">Limits & inclusions</h2>
          <p className="mt-1 text-sm text-zinc-600">Same numbers as the main pricing comparison—no surprises at signup.</p>
        </div>
        <dl className="grid gap-0 md:grid-cols-2">
          {content.limits.map((row, idx) => (
            <div
              key={row.label}
              className={[
                "flex items-center justify-between gap-4 px-6 py-4",
                "border-zinc-100",
                idx % 2 === 0 ? "md:border-r" : "",
                idx < content.limits.length - 2 ? "border-b" : "",
              ].join(" ")}
            >
              <dt className="text-sm font-medium text-zinc-700">{row.label}</dt>
              <dd className="text-sm font-semibold text-zinc-900">
                <TierLimitValue value={row.value} />
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <p className="mt-8 text-center text-sm text-zinc-600">
        <Link href="/pricing" className="font-semibold text-zinc-900 hover:underline">
          Compare all plans
        </Link>
      </p>
    </main>
  );
}
