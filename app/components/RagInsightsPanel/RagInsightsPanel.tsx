"use client";

import Link from "next/link";
import { useMemo } from "react";
import { BarChart3, Check, Download, Loader2, Lock, PieChart } from "lucide-react";

import type { RagInsightsExportSummary } from "@/lib/ragInsightsExport";
import { downloadRagInsightsCsvForExcel } from "@/lib/ragInsightsExport";
import { cn } from "@/lib/utils";

export type RagInsightChartMode = "answerable" | "intent" | "category" | "weak";

export const RAG_CHART_MODE_OPTIONS: { id: RagInsightChartMode; label: string; description: string }[] = [
  { id: "answerable", label: "Answerable", description: "Share of classified jobs by answerability" },
  { id: "intent", label: "Intent", description: "Share by FAQ intent" },
  { id: "category", label: "Category", description: "Top FAQ categories in the current filter" },
  { id: "weak", label: "Gaps", description: "Grouped no/unclear questions   mark resolved after updating Markdown" },
];

function buildRagDistributionRows(
  mode: "answerable" | "intent" | "category",
  insights: RagInsightsExportSummary,
): { key: string; count: number }[] {
  if (mode === "answerable") {
    return Object.entries(insights.byAnswerable)
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count);
  }
  if (mode === "intent") {
    return Object.entries(insights.byIntent)
      .filter(([, count]) => count > 0)
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count);
  }
  return insights.topCategories.map((c) => ({ key: c.category, count: c.count }));
}

const ANSWERABLE_COLORS: Record<string, string> = {
  yes: "#10b981",
  partial: "#0ea5e9",
  unclear: "#f59e0b",
  no: "#f43f5e",
};

const FALLBACK_PALETTE = ["#6366f1", "#8b5cf6", "#0ea5e9", "#14b8a6", "#f59e0b", "#ec4899", "#64748b"];

function rowColor(mode: RagInsightChartMode, key: string, index: number): string {
  if (mode === "answerable") return ANSWERABLE_COLORS[key] ?? FALLBACK_PALETTE[index % FALLBACK_PALETTE.length];
  return FALLBACK_PALETTE[index % FALLBACK_PALETTE.length];
}

function formatShortIso(iso: string | null): string {
  if (!iso) return " ";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

function ConicDonut({
  rows,
  mode,
}: {
  rows: { key: string; count: number }[];
  mode: "answerable" | "intent" | "category";
}) {
  const segments = useMemo(() => {
    const total = rows.reduce((s, r) => s + r.count, 0);
    if (total <= 0) return [];
    let acc = 0;
    return rows.map((r, i) => {
      const pct = (r.count / total) * 100;
      const start = acc;
      acc += pct;
      return { ...r, start, end: acc, color: rowColor(mode, r.key, i) };
    });
  }, [rows, mode]);

  if (segments.length === 0) {
    return (
      <div className="flex h-40 w-full max-w-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/80 text-center text-xs text-zinc-500">
        <PieChart className="mx-auto mb-2 h-8 w-8 text-zinc-300" aria-hidden />
        No data for chart
      </div>
    );
  }

  const gradient = segments.map((s) => `${s.color} ${s.start}% ${s.end}%`).join(", ");

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative h-40 w-40 shrink-0 rounded-full shadow-inner ring-1 ring-zinc-200/80"
        style={{ background: `conic-gradient(from -90deg, ${gradient})` }}
        role="img"
        aria-label={`Distribution chart, ${segments.length} segments`}
      >
        <div className="absolute inset-[28%] rounded-full bg-white shadow-sm ring-1 ring-zinc-100" />
      </div>
      <ul className="w-full max-w-[220px] space-y-1.5 text-xs">
        {segments.map((s) => (
          <li key={s.key} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: s.color }} aria-hidden />
            <span className="min-w-0 flex-1 truncate font-mono text-zinc-700" title={s.key}>
              {s.key}
            </span>
            <span className="shrink-0 tabular-nums text-zinc-600">{s.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export type RagInsightsPanelProps = {
  ragAnalyticsEnabled: boolean;
  analyticsRetentionDays: number;
  planSlug: string | null;
  insights: RagInsightsExportSummary | null;
  loading: boolean;
  ragChartMode: RagInsightChartMode;
  onRagChartModeChange: (mode: RagInsightChartMode) => void;
  apiKeyId: string;
  projectLabel: string;
  filterFrom: string;
  filterTo: string;
  filterAnswerable: string;
  filterIntent: string;
  filterCategory: string;
  onResolveGap?: (params: { fingerprint: string | null; jobId: string | null }) => Promise<void>;
  resolvingGapKey?: string | null;
};

export function RagInsightsPanel({
  ragAnalyticsEnabled,
  analyticsRetentionDays,
  planSlug,
  insights,
  loading,
  ragChartMode,
  onRagChartModeChange,
  apiKeyId,
  projectLabel,
  filterFrom,
  filterTo,
  filterAnswerable,
  filterIntent,
  filterCategory,
  onResolveGap,
  resolvingGapKey = null,
}: RagInsightsPanelProps) {
  if (!ragAnalyticsEnabled) {
    return (
      <section className="mt-10" aria-labelledby="rag-insights-upsell-heading">
        <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="absolute left-0 top-0 h-full w-1 bg-zinc-900" aria-hidden />
          <div className="pl-5 pr-4 py-5 sm:pl-6 sm:pr-5 sm:py-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-3">
                  <span
                    className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md border-2 border-zinc-900 bg-zinc-950 text-white shadow-sm"
                    aria-hidden
                  >
                    <Lock className="h-[18px] w-[18px]" strokeWidth={2} />
                  </span>
                  <div className="min-w-0">
                    <h2 id="rag-insights-upsell-heading" className="text-lg font-semibold tracking-tight text-zinc-950">
                      RAG insights
                    </h2>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                      Plan upgrade
                    </p>
                  </div>
                </div>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-600">
                Discover what customers are struggling to find, which questions hurt conversions, and where your FAQ or AI needs improvement, so you can reduce support load, improve user satisfaction, and turn more visitors into paying customers.
                </p>
                <ul className="mt-4 grid gap-2.5 text-sm text-zinc-700 sm:grid-cols-2">
                  {[
                    "Find unanswered questions costing you users and conversions",
                    "Understand real visitor intent and customer pain points",
                    "Improve weak AI answers before they impact trust",
                    "Discover the most important topics users care about",
                    "Reduce repetitive support questions with smarter FAQs",
                    "Spot recurring gaps and opportunities for product improvements",
                    "Track answer quality across projects and time ranges",
                    "Turn FAQ analytics into better retention and engagement",
                  ].map((text) => (
                    <li key={text} className="border-l-2 border-zinc-900 pl-3 text-sm leading-snug text-zinc-700">
                      {text}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex w-full shrink-0 flex-col gap-3 lg:w-[min(100%,240px)] lg:pt-1">
                <Link
                  href="/pricing"
                  className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-zinc-950 px-5 py-3.5 text-center text-sm font-semibold text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_10px_28px_-12px_rgba(0,0,0,0.55)] ring-1 ring-zinc-950 transition hover:bg-black hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.14),0_14px_36px_-12px_rgba(0,0,0,0.65)] hover:ring-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950 active:scale-[0.99]"
                >
                  <span className="relative z-10">View plans and upgrade</span>
                  <BarChart3
                    className="relative z-10 h-4 w-4 opacity-90 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
                <p className="text-center text-[11px] leading-snug text-zinc-500 lg:text-left">
                  Unlocks on the Usage tab. The same{" "}
                  <span className="font-medium text-zinc-800">Usage filters</span> drive job history and charts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const classifiedPct =
    insights && insights.totalRagJobs > 0
      ? Math.round((insights.totalWithClassification / insights.totalRagJobs) * 100)
      : 0;

  function onExportClick() {
    if (!insights) return;
    downloadRagInsightsCsvForExcel(insights, {
      projectLabel,
      apiKeyId,
      plan: planSlug ?? "unknown",
      filterFrom,
      filterTo,
      filterAnswerable,
      filterIntent,
      filterCategory,
      exportedAtIso: new Date().toISOString(),
    });
  }

  return (
    <section className="mt-10" aria-labelledby="rag-insights-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="rag-insights-heading" className="text-lg font-semibold text-zinc-900">
            RAG insights
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-zinc-600">
            FAQ-style breakdown for <code className="rounded bg-zinc-100 px-1 font-mono text-xs">taskType=rag</code>{" "}
            jobs. <span className="font-medium text-zinc-800">Usage filters</span> at the top of this tab (dates,
            answerable, intent, category) apply to everything below.
            {analyticsRetentionDays > 0 ? (
              <span className="text-zinc-500">
                {" "}
                History window: up to the last {analyticsRetentionDays} day
                {analyticsRetentionDays === 1 ? "" : "s"} (UTC).
              </span>
            ) : null}
          </p>
        </div>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-zinc-600">Loading RAG analytics…</p>
      ) : insights ? (
        <div className="mt-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">RAG jobs in filter</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900">{insights.totalRagJobs.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">With classification</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900">
                {insights.totalWithClassification.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-zinc-500">≈ {classifiedPct}% of RAG jobs in this filter</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Analytics window (UTC)</p>
              <p className="mt-1 text-sm font-medium text-zinc-900">
                {formatShortIso(insights.window.from)} → {formatShortIso(insights.window.to)}
              </p>
              <p className="mt-1 text-xs text-zinc-500">From server summary response</p>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                  <h3 className="text-sm font-semibold text-zinc-900">FAQ analysis</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <div
                      className="flex flex-wrap gap-1.5"
                      role="radiogroup"
                      aria-label="Choose what the chart shows"
                    >
                      {RAG_CHART_MODE_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          role="radio"
                          aria-checked={ragChartMode === opt.id}
                          title={opt.description}
                          onClick={() => onRagChartModeChange(opt.id)}
                          className={cn(
                            "rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500",
                            ragChartMode === opt.id
                              ? "border-sky-600 bg-sky-50 text-sky-900"
                              : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100",
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={onExportClick}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden />
                      Export for Excel (.csv)
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  {RAG_CHART_MODE_OPTIONS.find((o) => o.id === ragChartMode)?.description ?? "Distribution in the current filter."}
                </p>
              </div>
            </div>

            <div className="mt-5">
              {ragChartMode === "weak" ? (
                <div className="grid max-h-80 gap-2 overflow-y-auto sm:grid-cols-2">
                  {insights.weakAnswers.length === 0 ? (
                    <p className="text-sm text-zinc-500">None in this filter.</p>
                  ) : (
                    <>
                      {insights.weakAnswers.length > 24 ? (
                        <p className="col-span-full text-xs text-zinc-500">
                          Showing 24 of {insights.weakAnswers.length} groups. Export for Excel includes every row.
                        </p>
                      ) : null}
                      {insights.weakAnswers.slice(0, 24).map((q) => {
                        const gapKey = q.fingerprint ?? q.sampleJobId ?? q.sampleQuestion;
                        const resolving = resolvingGapKey === gapKey;
                        return (
                          <div
                            key={gapKey}
                            className="rounded-lg border border-amber-100 bg-linear-to-br from-amber-50/90 to-orange-50/40 px-3 py-2.5 text-sm text-amber-950 shadow-sm"
                          >
                            <p className="line-clamp-3 leading-snug">{q.sampleQuestion}</p>
                            {q.count > 1 ? (
                              <p className="mt-2 text-xs font-medium text-amber-900/90">
                                ×{q.count} similar in this window
                              </p>
                            ) : null}
                            {onResolveGap ? (
                              <button
                                type="button"
                                disabled={Boolean(resolvingGapKey)}
                                title="Mark as resolved (sets classification to yes) after updating your Markdown knowledge"
                                className="mt-2 inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-white px-2 py-1 text-xs font-medium text-emerald-900 hover:bg-emerald-50 disabled:opacity-50"
                                onClick={() =>
                                  void onResolveGap({
                                    fingerprint: q.fingerprint,
                                    jobId: q.sampleJobId ?? null,
                                  })
                                }
                              >
                                {resolving ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                                ) : (
                                  <Check className="h-3.5 w-3.5" aria-hidden />
                                )}
                                Mark resolved
                              </button>
                            ) : null}
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              ) : (
                (() => {
                  const rows = buildRagDistributionRows(ragChartMode, insights);
                  const denom = insights.totalWithClassification;
                  return rows.length === 0 ? (
                    <p className="text-sm text-zinc-500">No rows for this filter.</p>
                  ) : (
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
                      <div className="flex justify-center lg:w-[220px] lg:shrink-0">
                        <ConicDonut rows={rows} mode={ragChartMode} />
                      </div>
                      <ul className="min-w-0 flex-1 space-y-2.5 overflow-y-auto text-sm lg:max-h-80">
                        {rows.map(({ key, count }, index) => {
                          const pct = denom > 0 ? Math.min(100, (count / denom) * 100) : 0;
                          const segColor = rowColor(ragChartMode, key, index);
                          return (
                            <li key={key} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                              <span
                                className="w-full max-w-[min(100%,14rem)] shrink-0 truncate font-mono text-xs text-zinc-700 sm:w-40"
                                title={key}
                              >
                                {key}
                              </span>
                              <div className="flex min-w-0 flex-1 items-center gap-2">
                                <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-zinc-100">
                                  <div
                                    className="h-full rounded-full transition-[width]"
                                    style={{ width: `${pct}%`, backgroundColor: segColor }}
                                  />
                                </div>
                                <span className="w-12 shrink-0 text-right tabular-nums text-zinc-800">{count}</span>
                                <span className="hidden w-10 shrink-0 text-right text-xs tabular-nums text-zinc-500 sm:inline">
                                  {denom > 0 ? `${Math.round(pct)}%` : ""}
                                </span>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })()
              )}
            </div>

            <p className="mt-5 border-t border-zinc-100 pt-3 text-xs text-zinc-500">
              RAG jobs in filter: {insights.totalRagJobs.toLocaleString()} · With classification:{" "}
              {insights.totalWithClassification.toLocaleString()}
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-6 text-sm text-zinc-600">No RAG analytics available.</p>
      )}
    </section>
  );
}
