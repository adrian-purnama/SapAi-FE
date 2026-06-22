"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowBigRight,
  ArrowLeft,
  BarChart3,
  BookOpen,
  Check,
  Copy,
  Funnel,
  Info,
  Lock,
  RefreshCw,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";

import type { PublicChatJobResponse } from "@/lib/toPublicChatJob";
import { toastError, toastSuccess } from "@/lib/app-toast";
import { joinServerApiPath } from "@/lib/server-api";
import { useSapAi } from "@/app/providers/sapai-provider";
import { EditApiKeyAccessModal } from "@/app/forms/editApiKeyAccess/EditApiKeyAccessModal";
import { ProjectFaqDocumentsPanel } from "@/app/forms/projectFaqDocuments/ProjectFaqDocumentsPanel";
import { SearchableSelect } from "@/app/components/SearchableSelect";
import { DateRangePicker } from "@/app/components/DateRangePicker/DateRangePicker";
import { RagInsightsPanel, type RagInsightChartMode } from "@/app/components/RagInsightsPanel/RagInsightsPanel";
import type { RagInsightsExportSummary } from "@/lib/ragInsightsExport";

type UsageSummary = {
  totalJobs: number;
  completed: number;
  failed: number;
  cancelled: number;
  inFlight: number;
  totalTokens: number;
  lastJobAt: string | null;
  lastJobId: string | null;
};

type ProjectKeyMeta = {
  id: string;
  label: string;
  prefix: string;
  ipAllowlist?: string[];
  ipAllowlistCount: number;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string | null;
};

function truncateId(id: string): string {
  if (id.length <= 14) return id;
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

function previewText(text: string | null | undefined, max = 72): string {
  if (!text) return " ";
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

function formatUtcDateInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Oldest UTC day allowed in date pickers (aligns with server `clampUsageAndAnalyticsDateRange`). */
function oldestJobHistoryUtcYmd(analyticsRetentionDays: number): string {
  const now = new Date();
  if (analyticsRetentionDays <= 0) return formatUtcDateInput(now);
  const earliest = new Date(now.getTime() - analyticsRetentionDays * 86_400_000);
  return formatUtcDateInput(earliest);
}

function LockedClassificationPricingLink({ columnLabel }: { columnLabel: string }) {
  return (
    <Link
      href="/pricing"
      className="inline-flex size-8 items-center justify-center rounded-lg border border-black bg-black text-white hover:bg-zinc-900 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
      title={`${columnLabel} requires a plan with RAG analytics   view pricing`}
      aria-label={`${columnLabel}: upgrade your plan to unlock (opens pricing)`}
    >
      <Lock className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
    </Link>
  );
}

/** Shown in Answ./Intent/Category when `taskType` is not RAG   chat jobs are never FAQ-classified. */
function ChatNoClassificationMark() {
  return (
    <span
      className="inline-block cursor-help rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-2 py-0.5 text-center text-[10px] font-semibold uppercase tracking-wide text-zinc-600"
      title="FAQ answerability, intent, and category are only recorded for RAG (FAQ) jobs. Standard chat tasks do not produce these fields."
    >
      Chat
    </span>
  );
}

const RAG_ANSWERABLE_OPTIONS = ["yes", "no", "partial", "unclear"] as const;
const RAG_INTENT_OPTIONS = [
  "what_is",
  "how_to",
  "when",
  "where",
  "why",
  "who",
  "troubleshooting",
  "comparison",
  "confirmation",
] as const;

type ProjectDetailTab = "usage" | "rag";

export default function ProjectDetailPage() {
  const params = useParams();
  const apiKeyId = typeof params.apiKeyId === "string" ? params.apiKeyId : "";
  const router = useRouter();
  const { token, user } = useSapAi();
  const userPlan = user?.plan ?? null;
  const analyticsRetentionDays = userPlan?.analyticsRetentionDays ?? 0;
  const ragAnalyticsEnabled = userPlan?.ragAnalyticsEnabled ?? false;
  const historyTodayOnly = analyticsRetentionDays <= 0;

  const jobHistoryDateBounds = useMemo(() => {
    const max = formatUtcDateInput(new Date());
    const min = oldestJobHistoryUtcYmd(analyticsRetentionDays);
    return { min, max };
  }, [analyticsRetentionDays]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyMeta, setKeyMeta] = useState<ProjectKeyMeta | null>(null);
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [jobs, setJobs] = useState<PublicChatJobResponse[]>([]);
  const [jobsTotal, setJobsTotal] = useState(0);
  const [jobsPage, setJobsPage] = useState(1);
  const [jobsLimit, setJobsLimit] = useState(10);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterTaskType, setFilterTaskType] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [filterAnswerable, setFilterAnswerable] = useState("");
  const [filterIntent, setFilterIntent] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [jobsLoading, setJobsLoading] = useState(false);
  const [ragInsights, setRagInsights] = useState<RagInsightsExportSummary | null>(null);
  const [ragInsightsLoading, setRagInsightsLoading] = useState(false);
  const [ragChartMode, setRagChartMode] = useState<RagInsightChartMode>("answerable");
  const [resolvingGapKey, setResolvingGapKey] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editAccessOpen, setEditAccessOpen] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [rotateSecretCopied, setRotateSecretCopied] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [detailTab, setDetailTab] = useState<ProjectDetailTab>("usage");

  const loadMeta = useCallback(async () => {
    if (!apiKeyId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(joinServerApiPath(`/api/v1/api-keys/${encodeURIComponent(apiKeyId)}/usage`), {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const payload = await res.json();
      if (!res.ok || !payload?.success) {
        throw new Error(payload?.error?.message ?? "Failed to load project.");
      }
      const data = payload.data as {
        key: ProjectKeyMeta;
        summary: UsageSummary;
      };
      setKeyMeta(data.key);
      setSummary(data.summary);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load project.";
      setError(msg);
      toastError(msg, { id: "project-detail-meta" });
      setKeyMeta(null);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [apiKeyId, token]);

  const loadJobs = useCallback(async () => {
    if (!apiKeyId) return;
    setJobsLoading(true);
    try {
      const qs = new URLSearchParams();
      qs.set("page", String(jobsPage));
      qs.set("limit", String(jobsLimit));
      if (filterStatus.trim()) qs.set("status", filterStatus.trim());
      if (filterTaskType.trim()) qs.set("taskType", filterTaskType.trim());
      if (filterFrom.trim()) qs.set("from", `${filterFrom.trim()}T00:00:00.000Z`);
      if (filterTo.trim()) qs.set("to", `${filterTo.trim()}T23:59:59.999Z`);
      if (filterTaskType === "rag") {
        if (filterAnswerable.trim()) qs.set("answerable", filterAnswerable.trim());
        if (filterIntent.trim()) qs.set("intent", filterIntent.trim());
        if (filterCategory.trim()) qs.set("category", filterCategory.trim());
      }

      const res = await fetch(joinServerApiPath(`/api/v1/api-keys/${encodeURIComponent(apiKeyId)}/usage?${qs.toString()}`), {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const payload = await res.json();
      if (!res.ok || !payload?.success) {
        throw new Error(payload?.error?.message ?? "Failed to load jobs.");
      }
      const data = payload.data as {
        jobs: { items: PublicChatJobResponse[]; total: number; page: number; limit: number };
      };
      setJobs(data.jobs?.items ?? []);
      setJobsTotal(data.jobs?.total ?? 0);
    } catch (e) {
      setJobs([]);
      setJobsTotal(0);
      const msg = e instanceof Error ? e.message : "Failed to load jobs.";
      toastError(msg, { id: "project-detail-jobs" });
    } finally {
      setJobsLoading(false);
    }
  }, [
    apiKeyId,
    jobsPage,
    jobsLimit,
    filterStatus,
    filterTaskType,
    filterFrom,
    filterTo,
    filterAnswerable,
    filterIntent,
    filterCategory,
    token,
  ]);

  const loadRagInsights = useCallback(async () => {
    if (!apiKeyId || !token) return;
    setRagInsightsLoading(true);
    try {
      const qs = new URLSearchParams();
      if (filterFrom.trim()) qs.set("from", `${filterFrom.trim()}T00:00:00.000Z`);
      if (filterTo.trim()) qs.set("to", `${filterTo.trim()}T23:59:59.999Z`);
      if (filterAnswerable.trim()) qs.set("answerable", filterAnswerable.trim());
      if (filterIntent.trim()) qs.set("intent", filterIntent.trim());
      if (filterCategory.trim()) qs.set("category", filterCategory.trim());

      const res = await fetch(
        joinServerApiPath(`/api/v1/api-keys/${encodeURIComponent(apiKeyId)}/rag-analytics/summary?${qs.toString()}`),
        { method: "GET", headers: { Authorization: `Bearer ${token}` } },
      );
      const payload = await res.json();
      if (!res.ok || !payload?.success) {
        throw new Error(payload?.error?.message ?? "Failed to load RAG insights.");
      }
      setRagInsights(payload.data as RagInsightsExportSummary);
    } catch {
      setRagInsights(null);
    } finally {
      setRagInsightsLoading(false);
    }
  }, [
    apiKeyId,
    token,
    filterFrom,
    filterTo,
    filterAnswerable,
    filterIntent,
    filterCategory,
  ]);

  const resolveRagGap = useCallback(
    async (params: { fingerprint: string | null; jobId: string | null }) => {
      if (!apiKeyId || !token) return;
      const gapKey = params.fingerprint ?? params.jobId ?? "";
      setResolvingGapKey(gapKey);
      try {
        const res = await fetch(
          joinServerApiPath(`/api/v1/api-keys/${encodeURIComponent(apiKeyId)}/rag-analytics/resolve-gap`),
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...(params.fingerprint ? { fingerprint: params.fingerprint } : {}),
              ...(params.jobId ? { jobId: params.jobId } : {}),
            }),
          },
        );
        const payload = await res.json();
        if (!res.ok || !payload?.success) {
          throw new Error(payload?.error?.message ?? "Failed to mark gap resolved.");
        }
        const n = payload.data?.modifiedCount ?? 0;
        toastSuccess(
          n > 0 ? `Marked ${n} job${n === 1 ? "" : "s"} as yes (resolved).` : "No matching gap jobs to update.",
          { id: "rag-gap-resolve" },
        );
        await loadRagInsights();
        await loadJobs();
      } catch (e) {
        toastError(e instanceof Error ? e.message : "Failed to mark gap resolved.", { id: "rag-gap-resolve" });
      } finally {
        setResolvingGapKey(null);
      }
    },
    [apiKeyId, token, loadRagInsights, loadJobs],
  );

  useEffect(() => {
    if (!token) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadMeta();
  }, [loadMeta, token]);

  useEffect(() => {
    if (!token) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadJobs();
  }, [loadJobs, token]);

  useEffect(() => {
    if (!historyTodayOnly) return;
    const today = formatUtcDateInput(new Date());
    /* eslint-disable react-hooks/set-state-in-effect -- today-only retention: pin job history to today's UTC range */
    setFilterFrom(today);
    setFilterTo(today);
    setJobsPage(1);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [historyTodayOnly]);

  useEffect(() => {
    if (!token || detailTab !== "usage") return;
    if (!ragAnalyticsEnabled) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect -- plan without RAG analytics */
      setRagInsights(null);
      return;
    }
    void loadRagInsights();
  }, [loadRagInsights, token, detailTab, ragAnalyticsEnabled]);

  async function copyId(id: string) {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1200);
    } catch {
      // ignore
    }
  }

  async function copyRotateSecret() {
    if (!revealedKey) return;
    try {
      await navigator.clipboard.writeText(revealedKey);
      setRotateSecretCopied(true);
      window.setTimeout(() => setRotateSecretCopied(false), 1200);
    } catch {
      // ignore
    }
  }

  async function onRotateKey() {
    if (!apiKeyId || !token || !keyMeta || keyMeta.revokedAt) return;
    const ok = window.confirm("Rotate this API key? The old key will stop working.");
    if (!ok) return;
    try {
      const response = await fetch(joinServerApiPath(`/api/v1/api-keys/${encodeURIComponent(apiKeyId)}/rotate`), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error?.message ?? "Failed to rotate API key.");
      }
      const apiKey = String(payload?.data?.apiKey ?? "");
      if (apiKey) setRevealedKey(apiKey);
      toastSuccess("API key rotated. Copy the new secret   the old key no longer works.", { id: "project-detail-ops" });
      await loadMeta();
      await loadJobs();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to rotate API key.";
      toastError(msg, { id: "project-detail-ops" });
    }
  }

  async function onConfirmDelete() {
    if (!apiKeyId || !token) return;
    setDeleteBusy(true);
    try {
      const response = await fetch(joinServerApiPath(`/api/v1/api-keys/${encodeURIComponent(apiKeyId)}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error?.message ?? "Failed to delete API key.");
      }
      setDeleteConfirmOpen(false);
      router.replace("/dashboard");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to delete API key.";
      toastError(msg, { id: "project-detail-ops" });
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-5">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to dashboard
        </Link>
        {loading ? (
          <p className="mt-5 text-sm text-zinc-600">Loading project…</p>
        ) : error && !keyMeta ? (
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <p className="text-sm text-zinc-600">Could not load this project.</p>
            <button
              type="button"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
              onClick={() => void loadMeta()}
            >
              Retry
            </button>
          </div>
        ) : keyMeta ? (
          <div className="mt-3 rounded-lg border border-zinc-200/90 bg-white px-3 py-2.5 shadow-sm sm:px-3.5 sm:py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h1
                id="project-detail-title"
                className="min-w-0 flex-1 truncate text-lg font-semibold leading-snug text-zinc-900 sm:text-xl"
              >
                {keyMeta.label}
              </h1>
              {!keyMeta.revokedAt ? (
                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50"
                    title="Edit IP allowlist and rate limit"
                    aria-label="Edit IP allowlist and rate limit"
                    onClick={() => setEditAccessOpen(true)}
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50"
                    title="Rotate API key"
                    aria-label="Rotate API key"
                    onClick={() => void onRotateKey()}
                  >
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 bg-white text-red-700 hover:bg-red-50"
                    title="Delete project key"
                    aria-label="Delete project key"
                    onClick={() => setDeleteConfirmOpen(true)}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
              ) : null}
            </div>

            <div className="mt-2 border-t border-zinc-100 pt-2">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-600">
                <span className="inline-flex items-center gap-1.5">
                  <span className="shrink-0 font-semibold uppercase tracking-wide text-zinc-500">Key</span>
                  <code className="rounded border border-zinc-200 bg-zinc-50 px-1.5 py-px font-mono text-[11px] text-zinc-900">
                    {keyMeta.prefix}…
                  </code>
                  {keyMeta.revokedAt ? (
                    <span className="rounded-full border border-red-200 bg-red-50 px-1.5 py-px text-[10px] font-semibold text-red-700">
                      Revoked
                    </span>
                  ) : null}
                </span>
              </div>

              {summary ? (
                <p
                  className="mt-1.5 truncate text-[11px] leading-snug text-zinc-600"
                  title={
                    [
                      summary.lastJobAt ? new Date(summary.lastJobAt).toLocaleString() : " ",
                      summary.lastJobId ? `Job ${summary.lastJobId}` : "",
                      summary.cancelled > 0 ? `${summary.cancelled} cancelled` : "",
                    ]
                      .filter(Boolean)
                      .join(" · ") || undefined
                  }
                >
                  <span className="font-medium text-zinc-700">Last:</span>{" "}
                  {summary.lastJobAt ? new Date(summary.lastJobAt).toLocaleString() : " "}
                  {summary.lastJobId ? (
                    <>
                      {" "}
                      <span className="text-zinc-400">·</span> <span className="font-medium text-zinc-700">Job</span>{" "}
                      <code className="font-mono text-[11px] text-zinc-800">{truncateId(summary.lastJobId)}</code>
                    </>
                  ) : null}
                  {summary.cancelled > 0 ? (
                    <span className="text-zinc-500"> · Cancelled {summary.cancelled}</span>
                  ) : null}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <EditApiKeyAccessModal
        open={editAccessOpen && Boolean(keyMeta) && !keyMeta?.revokedAt}
        apiKeyId={apiKeyId}
        apiKeyLabel={keyMeta?.label ?? ""}
        ipAllowlist={keyMeta?.ipAllowlist}
        token={token}
        onClose={() => setEditAccessOpen(false)}
        onSaved={() => void loadMeta()}
      />

      {revealedKey ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-zinc-950/30"
            aria-label="Close"
            onClick={() => setRevealedKey(null)}
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900">New API key</h3>
                <p className="mt-1 text-sm text-zinc-600">Copy it now   the old key no longer works.</p>
              </div>
              <button
                type="button"
                className="rounded-lg px-2 py-1 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                onClick={() => setRevealedKey(null)}
              >
                Close
              </button>
            </div>
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                <code className="min-w-0 flex-1 overflow-x-auto rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs text-zinc-900">
                  {revealedKey}
                </code>
                <button
                  type="button"
                  className={[
                    "inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white transition-all duration-150 ease-out hover:bg-zinc-800 active:scale-[0.98] sm:w-auto",
                    rotateSecretCopied ? "scale-[1.04] ring-2 ring-zinc-900/10 shadow-md" : "ring-0 shadow-none",
                  ].join(" ")}
                  onClick={() => void copyRotateSecret()}
                >
                  {rotateSecretCopied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
                  {rotateSecretCopied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {deleteConfirmOpen && keyMeta ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-zinc-950/30"
            aria-label="Close"
            onClick={() => !deleteBusy && setDeleteConfirmOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-700 ring-1 ring-red-200">
                <Trash2 className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-zinc-900">Delete API key?</h3>
                <p className="mt-1 text-sm text-zinc-600">
                  This removes the project, FAQ files, and vectors for this key. This cannot be undone.{" "}
                  <span className="font-semibold text-zinc-900">{keyMeta.label}</span>
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                className="h-10 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
                disabled={deleteBusy}
                onClick={() => setDeleteConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                disabled={deleteBusy}
                onClick={() => void onConfirmDelete()}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                {deleteBusy ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {!loading && !error && summary && keyMeta ? (
        <>
          <div
            className="mt-6 flex gap-8 border-b border-zinc-200/90"
            role="tablist"
            aria-label="Project sections"
          >
            <button
              type="button"
              role="tab"
              aria-selected={detailTab === "usage"}
              id="project-tab-usage"
              aria-controls="project-panel-usage"
              className={[
                "group relative -mb-px inline-flex items-center gap-2 border-b-2 pb-3 pt-1 text-sm font-medium transition-colors",
                detailTab === "usage"
                  ? "border-zinc-900 text-zinc-900"
                  : "border-transparent text-zinc-500 hover:text-zinc-800",
              ].join(" ")}
              onClick={() => setDetailTab("usage")}
            >
              <BarChart3
                className={[
                  "h-4 w-4 shrink-0 transition-opacity",
                  detailTab === "usage" ? "opacity-100" : "opacity-50 group-hover:opacity-80",
                ].join(" ")}
                aria-hidden
              />
              Usage
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={detailTab === "rag"}
              id="project-tab-rag"
              aria-controls="project-panel-rag"
              className={[
                "group relative -mb-px inline-flex items-center gap-2 border-b-2 pb-3 pt-1 text-sm font-medium transition-colors",
                detailTab === "rag"
                  ? "border-zinc-900 text-zinc-900"
                  : "border-transparent text-zinc-500 hover:text-zinc-800",
              ].join(" ")}
              onClick={() => setDetailTab("rag")}
            >
              <BookOpen
                className={[
                  "h-4 w-4 shrink-0 transition-opacity",
                  detailTab === "rag" ? "opacity-100" : "opacity-50 group-hover:opacity-80",
                ].join(" ")}
                aria-hidden
              />
              RAG / FAQ
            </button>
          </div>

          {detailTab === "usage" ? (
            <div id="project-panel-usage" role="tabpanel" aria-labelledby="project-tab-usage" className="mt-6">
              <section
                className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm sm:p-4"
                aria-labelledby="usage-filters-heading"
              >
                <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-b border-zinc-100 pb-2.5">
                  <div className="min-w-0">

                    <div className="flex gap-1 items-center">
                      <Funnel className="h-4 w-4" aria-hidden />
                      <h2 id="usage-filters-heading" className="text-base font-semibold text-zinc-900">
                        Filters
                      </h2>
                    </div>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      Filter you API Key usage
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:items-end lg:gap-x-3 lg:gap-y-2">
                  <div className="min-w-0 sm:col-span-2 lg:col-span-5">
                    <DateRangePicker
                      compact
                      idPrefix="job-history-created"
                      label="Created (UTC)"
                      description={
                        historyTodayOnly
                          ? `${userPlan?.name ?? "Your plan"}: only today (UTC)   dates are fixed.`
                          : `${userPlan?.name ?? "Your plan"}: pick any range within the last ${analyticsRetentionDays} day(s) (UTC).`
                      }
                      from={filterFrom}
                      to={filterTo}
                      min={jobHistoryDateBounds.min}
                      max={jobHistoryDateBounds.max}
                      disabled={historyTodayOnly}
                      onRangeChange={(f, t) => {
                        setFilterFrom(f);
                        setFilterTo(t);
                        setJobsPage(1);
                      }}
                    />
                  </div>
                  <div className="w-full min-w-0 sm:max-w-46 lg:col-span-2">
                    <SearchableSelect
                      dense
                      label="Task type"
                      value={filterTaskType}
                      onChange={(v) => {
                        setFilterTaskType(v);
                        setJobsPage(1);
                        if (v !== "rag") {
                          setFilterAnswerable("");
                          setFilterIntent("");
                          setFilterCategory("");
                        }
                      }}
                      options={[
                        { value: "", label: "All types" },
                        { value: "chat", label: "Chat" },
                        { value: "rag", label: "RAG" },
                      ]}
                    />
                  </div>
                  <div className="w-full min-w-0 sm:max-w-54 lg:col-span-3">
                    <SearchableSelect
                      dense
                      label="Status"
                      value={filterStatus}
                      onChange={(v) => {
                        setFilterStatus(v);
                        setJobsPage(1);
                      }}
                      options={[
                        { value: "", label: "All" },
                        { value: "pending", label: "pending" },
                        { value: "queued", label: "queued" },
                        { value: "running", label: "running" },
                        { value: "completed_partial", label: "completed_partial" },
                        { value: "completed_full", label: "completed_full" },
                        { value: "failed", label: "failed" },
                        { value: "cancelled", label: "cancelled" },
                      ]}
                    />
                  </div>
                  <div className="w-full min-w-0 sm:max-w-36 lg:col-span-2">
                    <SearchableSelect
                      dense
                      label="Per page"
                      value={String(jobsLimit)}
                      onChange={(v) => {
                        setJobsLimit(Number(v) || 10);
                        setJobsPage(1);
                      }}
                      options={[
                        { value: "10", label: "10" },
                        { value: "25", label: "25" },
                        { value: "50", label: "50" },
                      ]}
                    />
                  </div>
                </div>

                <div className="mt-3 border-t border-zinc-100 pt-3">
                  {filterTaskType === "rag" ? (
                    <div>
                      <div className="flex gap-1 items-center">
                        <p className="w-full shrink-0 text-[12px] font-semibold">
                          RAG filters
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:gap-x-3 sm:gap-y-2">
                        <div className="w-full min-w-0 sm:w-38">
                          <SearchableSelect
                            dense
                            label="Answerable"
                            value={filterAnswerable}
                            onChange={(v) => {
                              setFilterAnswerable(v);
                              setJobsPage(1);
                            }}
                            options={[
                              { value: "", label: "Any" },
                              ...RAG_ANSWERABLE_OPTIONS.map((x) => ({ value: x, label: x })),
                            ]}
                          />
                        </div>
                        <div className="w-full min-w-0 sm:w-42">
                          <SearchableSelect
                            dense
                            label="Intent"
                            value={filterIntent}
                            onChange={(v) => {
                              setFilterIntent(v);
                              setJobsPage(1);
                            }}
                            options={[
                              { value: "", label: "Any" },
                              ...RAG_INTENT_OPTIONS.map((x) => ({ value: x, label: x })),
                            ]}
                          />
                        </div>
                        <div className="min-w-0 flex-1 sm:min-w-48">
                          <div className="flex flex-col">
                            <label className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500" htmlFor="job-filter-category">
                              Category
                            </label>
                            <label className="text-[8px] font-semibold uppercase tracking-wide text-zinc-400" htmlFor="job-filter-category">
                              Hint : This is defined by the user in Dasboard &gt; Rag / FAQ tab
                            </label>
                          </div>
                          <input
                            id="job-filter-category"
                            type="text"
                            placeholder="Label or __uncategorized"
                            className="mt-0.5 h-9 w-full min-w-0 rounded-md border border-zinc-200 bg-white px-2 text-xs"
                            value={filterCategory}
                            onChange={(e) => {
                              setFilterCategory(e.target.value);
                              setJobsPage(1);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-1 items-center">
                      <Info className="h-4 w-4" aria-hidden />
                      <p className="text-[11px] leading-snug text-zinc-600">
                        <span className="font-medium text-zinc-700">Hint : Advance filter for RAG can be avaiilable when TASK TYPE is set to RAG </span>
                      </p>
                    </div>
                  )}
                </div>
              </section>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Jobs</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900">{summary.totalJobs}</p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Token Used</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900">
                    {summary.totalTokens.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Completed / failed</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900">
                    <span className="text-emerald-700">{summary.completed}</span>
                    <span className="text-zinc-400"> / </span>
                    <span className="text-red-700">{summary.failed}</span>
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">In flight</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-amber-800">{summary.inFlight}</p>
                </div>
              </div>

              <RagInsightsPanel
                ragAnalyticsEnabled={ragAnalyticsEnabled}
                analyticsRetentionDays={analyticsRetentionDays}
                planSlug={userPlan?.slug ?? null}
                insights={ragInsights}
                loading={ragInsightsLoading}
                ragChartMode={ragChartMode}
                onRagChartModeChange={setRagChartMode}
                apiKeyId={apiKeyId}
                projectLabel={keyMeta.label}
                filterFrom={filterFrom}
                filterTo={filterTo}
                filterAnswerable={filterAnswerable}
                filterIntent={filterIntent}
                filterCategory={filterCategory}
                onResolveGap={ragAnalyticsEnabled ? resolveRagGap : undefined}
                resolvingGapKey={resolvingGapKey}
              />

              <section className="mt-10">
                <h2 className="text-lg font-semibold text-zinc-900">Recent chat jobs</h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Filtered results for this project key. Use the job id with{" "}
                  <code className="rounded bg-zinc-100 px-1 font-mono text-xs">GET /api/v1/chat/jobs/:id</code>. Adjust
                  filters in <span className="font-medium text-zinc-800">Usage filters</span> above.
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-end gap-2 text-sm">
                  <button
                    type="button"
                    className="h-9 rounded-lg border border-zinc-200 bg-white px-3 font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
                    disabled={jobsLoading || jobsPage <= 1}
                    onClick={() => setJobsPage((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </button>
                  <span className="text-xs text-zinc-600">
                    Page <span className="font-semibold text-zinc-900">{jobsPage}</span>
                    {jobsTotal > 0 ? (
                      <>
                        {" "}
                        · <span className="tabular-nums">{jobsTotal.toLocaleString()}</span> jobs
                      </>
                    ) : null}
                  </span>
                  <button
                    type="button"
                    className="h-9 rounded-lg border border-zinc-200 bg-white px-3 font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
                    disabled={jobsLoading || jobsPage * jobsLimit >= jobsTotal}
                    onClick={() => setJobsPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>

                {jobsLoading ? (
                  <p className="mt-4 text-sm text-zinc-600">Loading jobs…</p>
                ) : null}

                {jobs.length === 0 ? (
                  <p className="mt-6 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/80 px-4 py-8 text-center text-zinc-600">
                    No jobs yet for this key.
                  </p>
                ) : (
                  <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
                    <table className="w-full min-w-[880px] text-left text-sm">
                      <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        <tr>
                          <th className="px-3 py-2">Job id</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2">Task</th>
                          <th className="px-3 py-2">Model</th>
                          <th className="px-3 py-2">Question</th>
                          <th className="px-3 py-2">Answ.</th>
                          <th className="px-3 py-2">Intent</th>
                          <th className="px-3 py-2">Category</th>
                          <th className="px-3 py-2">Answer</th>
                          <th className="px-3 py-2">Tokens</th>
                          <th className="px-3 py-2">Created</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {jobs.map((job) => (
                          <tr key={job.id} className="hover:bg-zinc-50/80">
                            <td className="px-3 py-2 font-mono text-xs">
                              <span title={job.id}>{truncateId(job.id)}</span>
                              <button
                                type="button"
                                className="ml-1 inline-flex align-middle text-zinc-500 hover:text-zinc-900"
                                aria-label="Copy job id"
                                onClick={() => void copyId(job.id)}
                              >
                                {copiedId === job.id ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className={[
                                  "rounded-full px-2 py-0.5 text-xs font-medium",
                                  job.status === "completed_partial" || job.status === "completed_full"
                                    ? "bg-emerald-50 text-emerald-800"
                                    : job.status === "failed"
                                      ? "bg-red-50 text-red-800"
                                      : ["pending", "queued", "running"].includes(job.status)
                                        ? "bg-amber-50 text-amber-900"
                                        : "bg-zinc-100 text-zinc-700",
                                ].join(" ")}
                              >
                                {job.status}
                              </span>
                            </td>
                            <td className="px-3 py-2 font-mono text-xs">{job.taskType}</td>
                            <td className="px-3 py-2 font-mono text-xs">{job.model}</td>
                            <td className="max-w-[200px] truncate px-3 py-2 text-xs text-zinc-600" title={job.question ?? ""}>
                              {previewText(job.question)}
                            </td>
                            <td className="px-3 py-2 text-center">
                              {!ragAnalyticsEnabled && job.taskType === "rag" ? (
                                <LockedClassificationPricingLink columnLabel="Answerability" />
                              ) : job.taskType !== "rag" ? (
                                <ChatNoClassificationMark />
                              ) : (
                                <span className="font-mono text-xs text-zinc-700">{job.ragAnalysis?.answerable ?? " "}</span>
                              )}
                            </td>
                            <td className="max-w-[100px] truncate px-3 py-2 text-center">
                              {!ragAnalyticsEnabled && job.taskType === "rag" ? (
                                <LockedClassificationPricingLink columnLabel="Intent" />
                              ) : job.taskType !== "rag" ? (
                                <ChatNoClassificationMark />
                              ) : (
                                <span className="font-mono text-xs text-zinc-700" title={job.ragAnalysis?.intent ?? ""}>
                                  {job.ragAnalysis?.intent ?? " "}
                                </span>
                              )}
                            </td>
                            <td className="max-w-[120px] truncate px-3 py-2 text-center">
                              {!ragAnalyticsEnabled && job.taskType === "rag" ? (
                                <LockedClassificationPricingLink columnLabel="Category" />
                              ) : job.taskType !== "rag" ? (
                                <ChatNoClassificationMark />
                              ) : (
                                <span className="text-xs text-zinc-600" title={job.ragAnalysis?.category ?? ""}>
                                  {job.ragAnalysis?.category ? previewText(job.ragAnalysis.category, 48) : " "}
                                </span>
                              )}
                            </td>
                            <td className="max-w-[200px] truncate px-3 py-2 text-xs text-zinc-600" title={job.result?.text ?? ""}>
                              {previewText(job.result?.text)}
                            </td>
                            <td className="px-3 py-2 tabular-nums">
                              {job.result?.totalTokens != null ? job.result.totalTokens.toLocaleString() : " "}
                            </td>
                            <td className="px-3 py-2 text-xs text-zinc-600">
                              {job.createdAt ? new Date(job.createdAt).toLocaleString() : " "}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          ) : (
            <div id="project-panel-rag" role="tabpanel" aria-labelledby="project-tab-rag" className="mt-6">
              <div className="rounded-lg border border-zinc-200 bg-zinc-50/60 px-4 py-3 text-sm text-zinc-700">
                <div className="flex gap-1 items-center text-zinc-900">
                  <p>Knowledge</p>
                  <ArrowBigRight className="h-4 w-4" aria-hidden />
                  <p>Embed</p>
                  <ArrowBigRight className="h-4 w-4" aria-hidden />
                  <p>Test</p>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-zinc-600">
                  Upload your knowledge base, add categories for insight, generate an embed token, and test your RAG with a public embed.
                </p>
              </div>
              <section className="mt-6">
                <ProjectFaqDocumentsPanel apiKeyId={apiKeyId} disabled={Boolean(keyMeta.revokedAt)} />
              </section>
            </div>
          )}
        </>
      ) : null}
    </main>
  );
}
