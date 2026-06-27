import type { Metadata } from "next";
import Link from "next/link";
import { Check, CheckCircle2, Sparkles, X } from "lucide-react";

import { getPublicPricingForPage } from "@/lib/pricing-public";
import { buildPageMetadata } from "@/lib/site-metadata";
import PlanPayButton from "../PlanPayButton";
import PlanGetStartedLink from "../PlanGetStartedLink";

function TierLimitValue({ value }: { value: string }) {
  if (value === " ") {
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

function formatPriceDisplay(priceLabel: string | null): string {
  const label = priceLabel?.trim();
  if (!label || label === "0") return "Free";
  return label;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tier: string }>;
}): Promise<Metadata> {
  const { tier } = await params;
  const slug = tier.trim().toLowerCase();
  const { plans } = await getPublicPricingForPage();
  const plan = plans.find((p) => p.slug === slug);

  if (!plan) {
    return buildPageMetadata({
      title: "Pricing tier not found",
      description: "This pricing tier does not exist.",
      path: `/pricing/${tier}`,
      noIndex: true,
    });
  }

  return buildPageMetadata({
    title: `${plan.name} pricing`,
    description: plan.description || `${plan.name} plan limits and features.`,
    path: `/pricing/${plan.slug}`,
  });
}

export default async function PricingTierPage({
  params,
}: {
  params: Promise<{ tier: string }>;
}) {
  const { tier } = await params;
  const slug = tier.trim().toLowerCase();
  const { plans, compareRows, cardBullets } = await getPublicPricingForPage();
  const planIdx = plans.findIndex((p) => p.slug === slug);
  const plan = planIdx >= 0 ? plans[planIdx] : null;
  const bullets = planIdx >= 0 ? (cardBullets[planIdx] ?? []) : [];
  const accent = plan?.accentColor?.trim() || "#18181b";

  const limits =
    plan && planIdx >= 0
      ? compareRows.map((row) => ({
          label: row.label,
          value: row.values[planIdx] ?? " ",
        }))
      : [];

  if (!plan) {
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
        className="relative mt-5 overflow-hidden rounded-3xl border border-zinc-200 bg-linear-to-br from-zinc-50 via-white to-white px-6 py-8 shadow-sm sm:px-7 sm:py-10"
        style={{ borderColor: `${accent}44` }}
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-violet-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-amber-200/40 blur-3xl" />
        <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between md:gap-10">
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
              <Sparkles className="h-3.5 w-3.5 text-zinc-700" aria-hidden />
              {plan.name}
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-900">{plan.name}</h1>
            <p className="mt-2 text-2xl font-semibold text-zinc-900">
              {formatPriceDisplay(plan.priceLabel)}{" "}
              {plan.priceNote?.trim() ? (
                <span className="text-base font-medium text-zinc-500">{plan.priceNote}</span>
              ) : null}
            </p>
            {plan.description?.trim() ? (
              <p className="mt-3 max-w-2xl text-lg text-zinc-600">{plan.description}</p>
            ) : null}

            <div className="mt-7 flex flex-wrap items-center gap-3">
              {plan.isPayable ? (
                <PlanPayButton
                  planSlug={plan.slug}
                  accentColor={accent}
                  className="inline-flex h-11 items-center justify-center rounded-full px-7 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                />
              ) : (
                <PlanGetStartedLink
                  accentColor={accent}
                  withArrow
                  className="inline-flex h-11 items-center justify-center rounded-full px-7 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                />
              )}
              <Link
                href="/docs/api"
                className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 bg-white px-7 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50"
              >
                Read API docs
              </Link>
            </div>
          </div>

          {plan.imageUrl ? (
            <div className="relative mx-auto flex w-full max-w-[220px] shrink-0 justify-center md:mx-0 md:max-w-[260px]">
              <img
                src={plan.imageUrl}
                alt=""
                className="h-auto w-full object-contain drop-shadow-sm"
              />
            </div>
          ) : null}
        </div>
      </section>

      {bullets.length > 0 ? (
        <section className="mt-8 grid gap-3 sm:grid-cols-2">
          {bullets.map((bullet) => (
            <div key={bullet} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-zinc-800" aria-hidden />
                <p className="text-sm font-medium leading-snug text-zinc-800">{bullet}</p>
              </div>
            </div>
          ))}
        </section>
      ) : null}

      {limits.length > 0 ? (
        <section className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-100 px-6 py-5">
            <h2 className="text-lg font-semibold text-zinc-900">Limits & inclusions</h2>
            <p className="mt-1 text-sm text-zinc-600">Same numbers as the main pricing comparison no surprises at signup.</p>
          </div>
          <dl className="grid gap-0 md:grid-cols-2">
            {limits.map((row, idx) => (
              <div
                key={row.label}
                className={[
                  "flex items-center justify-between gap-4 px-6 py-4",
                  "border-zinc-100",
                  idx % 2 === 0 ? "md:border-r" : "",
                  idx < limits.length - 2 ? "border-b" : "",
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
      ) : null}

      <p className="mt-8 text-center text-sm text-zinc-600">
        <Link href="/pricing" className="font-semibold text-zinc-900 hover:underline">
          Compare all plans
        </Link>
      </p>
    </main>
  );
}
