import type { Metadata } from "next";
import Link from "next/link";
import { Check, Crown, X } from "lucide-react";

import { getPublicPricingForPage } from "@/lib/pricing-public";
import { buildPageMetadata } from "@/lib/site-metadata";
import PlanPayButton from "./PlanPayButton";
import PlanGetStartedLink from "./PlanGetStartedLink";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "Pricing",
    description:
      "Compare plans: Markdown RAG knowledge, vector search, usage analytics, public embed widget, and priority processing.",
    path: "/pricing",
  });
}

function ComparePlanCell({ value }: { value: string }) {
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

function cardGridClass(count: number): string {
  if (count <= 1) return "mt-10 grid auto-rows-fr items-stretch gap-6 md:grid-cols-1";
  if (count === 2) return "mt-10 grid auto-rows-fr items-stretch gap-6 md:grid-cols-2";
  return "mt-10 grid auto-rows-fr items-stretch gap-6 md:grid-cols-3";
}

export default async function PricingPage() {
  const { plans, compareRows, cardBullets } = await getPublicPricingForPage();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12">
      <section className="mx-auto max-w-3xl text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
          <Crown className="h-3.5 w-3.5 text-violet-600" aria-hidden />
          Pricing for projects that ship
        </div>
        <div className="relative isolate mt-4">
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

      {plans.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-zinc-600">Pricing plans are being configured. Check back soon.</p>
        </div>
      ) : (
        <div className={cardGridClass(plans.length)}>
          {plans.map((plan, idx) => {
            const accent = plan.accentColor?.trim() || "#18181b";
            const bullets = cardBullets[idx] ?? [];

            return (
              <div
                key={plan.slug}
                className="group relative isolate flex h-full flex-col rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                style={{ borderColor: `${accent}55` }}
              >
                {plan.imageUrl ? (
                  <img src={plan.imageUrl} alt="" className="h-auto w-30" />
                ) : null}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-500">Plan</p>
                    <h2 className="mt-1 text-xl font-semibold text-zinc-950">{plan.name}</h2>
                  </div>
                  <Link
                    href={`/pricing/${plan.slug}`}
                    className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
                  >
                    Details
                  </Link>
                </div>

                <p className="mt-4 text-4xl font-semibold tracking-tight text-zinc-950">
                  {formatPriceDisplay(plan.priceLabel)}
                  {plan.priceNote?.trim() ? (
                    <span className="ml-2 text-base font-medium text-zinc-500">{plan.priceNote}</span>
                  ) : null}
                </p>
                {plan.description?.trim() ? (
                  <p className="mt-2 text-sm text-zinc-600">{plan.description}</p>
                ) : null}

                {bullets.length > 0 ? (
                  <ul className="mt-6 flex-1 space-y-2 text-sm text-zinc-700">
                    {bullets.map((b) => (
                      <li key={b} className="flex gap-2">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-300" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex-1" />
                )}

                <div className="mt-8">
                  {plan.isPayable ? (
                    <PlanPayButton planSlug={plan.slug} accentColor={accent} />
                  ) : (
                    <PlanGetStartedLink accentColor={accent} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {plans.length > 0 && compareRows.length > 0 ? (
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
                  {plans.map((plan) => (
                    <th key={plan.slug} className="px-6 py-3">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {compareRows.map((row) => (
                  <tr key={row.label}>
                    <td className="px-6 py-3 font-medium text-zinc-900">{row.label}</td>
                    {row.values.map((value, colIdx) => (
                      <td key={`${row.label}-${plans[colIdx]?.slug ?? colIdx}`} className="px-6 py-3 text-zinc-700">
                        <ComparePlanCell value={value} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </main>
  );
}
