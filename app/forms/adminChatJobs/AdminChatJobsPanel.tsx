"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ChevronLeft, ChevronRight, MessageSquare, RefreshCw } from "lucide-react";
import { SearchableSelect } from "@/app/components/SearchableSelect";
import { useAdminPlans } from "@/app/forms/adminPlans/useAdminPlans";
import {
  CHAT_JOB_STATUSES,
  CHAT_TASK_TYPES,
  useAdminChatJobs,
} from "./useAdminChatJobs";

function statusKind(status: string): "ok" | "warn" | "bad" | "muted" | "accent" {
  if (status.startsWith("completed")) return "ok";
  if (status === "failed" || status === "cancelled") return "bad";
  if (status === "running" || status === "streaming") return "accent";
  if (status === "queued" || status === "pending") return "warn";
  return "muted";
}

function statusPill(status: string) {
  const styles = {
    ok: "border-emerald-200 bg-emerald-50 text-emerald-800",
    warn: "border-amber-200 bg-amber-50 text-amber-900",
    bad: "border-red-200 bg-red-50 text-red-800",
    muted: "border-zinc-200 bg-zinc-50 text-zinc-600",
    accent: "border-violet-200 bg-violet-50 text-violet-800",
  };
  const kind = statusKind(status);
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${styles[kind]}`}
    >
      {status}
    </span>
  );
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

function truncate(s: string | null, max = 60) {
  if (!s) return "—";
  return s.length <= max ? s : `${s.slice(0, max)}…`;
}

export default function AdminChatJobsPanel() {
  const {
    jobs,
    loading,
    error,
    refetch,
    hasAuth,
    page,
    setPage,
    limit,
    total,
    filters,
    setFilters,
    applyFilters,
    resetFilters,
  } = useAdminChatJobs();

  const { plans } = useAdminPlans();

  const taskTypeOptions = useMemo(
    () => [
      { value: "", label: "Any task type" },
      ...CHAT_TASK_TYPES.map((t) => ({ value: t, label: t })),
    ],
    [],
  );

  const statusOptions = useMemo(
    () => [
      { value: "", label: "Any status" },
      ...CHAT_JOB_STATUSES.map((s) => ({ value: s, label: s })),
    ],
    [],
  );

  const planOptions = useMemo(
    () => [
      { value: "", label: "Any plan" },
      ...plans.map((p) => ({ value: p.slug, label: `${p.name} (${p.slug})` })),
    ],
    [plans],
  );

  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (!hasAuth) {
    return (
      <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Authentication required (admin).
      </p>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SearchableSelect
            dense
            ui="square"
            label="Task type"
            value={filters.taskType}
            placeholder="Any task type"
            onChange={(taskType) => setFilters((f) => ({ ...f, taskType }))}
            options={taskTypeOptions}
          />
          <SearchableSelect
            dense
            ui="square"
            label="Status"
            value={filters.status}
            placeholder="Any status"
            onChange={(status) => setFilters((f) => ({ ...f, status }))}
            options={statusOptions}
          />
          <SearchableSelect
            dense
            ui="square"
            label="Plan"
            value={filters.plan}
            placeholder="Any plan"
            onChange={(plan) => setFilters((f) => ({ ...f, plan }))}
            options={planOptions}
          />
          <label className="block text-xs font-semibold text-zinc-600">
            User email
            <input
              value={filters.userEmail}
              onChange={(e) => setFilters((f) => ({ ...f, userEmail: e.target.value }))}
              placeholder="partial match"
              className="mt-1 h-9 w-full rounded-lg border border-zinc-300 bg-white px-2 text-sm text-zinc-900"
            />
          </label>
          <label className="block text-xs font-semibold text-zinc-600">
            User ID
            <input
              value={filters.userId}
              onChange={(e) => setFilters((f) => ({ ...f, userId: e.target.value }))}
              placeholder="ObjectId"
              className="mt-1 h-9 w-full rounded-lg border border-zinc-300 bg-white px-2 text-sm font-mono text-zinc-900"
            />
          </label>
          <label className="block text-xs font-semibold text-zinc-600">
            API key ID
            <input
              value={filters.apiKeyId}
              onChange={(e) => setFilters((f) => ({ ...f, apiKeyId: e.target.value }))}
              placeholder="ObjectId"
              className="mt-1 h-9 w-full rounded-lg border border-zinc-300 bg-white px-2 text-sm font-mono text-zinc-900"
            />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applyFilters()}
            className="inline-flex h-9 items-center rounded-lg bg-violet-600 px-4 text-sm font-semibold text-white hover:bg-violet-700"
          >
            Apply filters
          </button>
          <button
            type="button"
            onClick={() => resetFilters()}
            className="inline-flex h-9 items-center rounded-lg border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => void refetch()}
            className="inline-flex h-9 items-center rounded-lg border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
            Refresh
          </button>
        </div>
      </div>

      {loading ? <p className="text-sm text-zinc-600">Loading jobs…</p> : null}
      {error && !loading ? <p className="text-sm text-red-700">{error}</p> : null}

      {!loading && jobs.length === 0 ? (
        <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-600">
          No chat jobs match your filters.
        </p>
      ) : null}

      {jobs.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Task</th>
                <th className="px-4 py-3">Model</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Question</th>
                <th className="px-4 py-3">Tokens</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {jobs.map((j) => (
                <tr key={j.id} className="hover:bg-zinc-50/80">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-600">{fmtDate(j.createdAt)}</td>
                  <td className="px-4 py-3">{statusPill(j.status)}</td>
                  <td className="px-4 py-3 font-medium text-zinc-900">{j.taskType}</td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-700">{j.model}</td>
                  <td className="px-4 py-3 text-zinc-700">{j.plan}</td>
                  <td className="px-4 py-3">
                    {j.userEmail ? (
                      <Link
                        href={`/admin/users/${j.userId}`}
                        className="font-medium text-violet-700 hover:underline"
                      >
                        {j.userEmail}
                      </Link>
                    ) : (
                      <span className="font-mono text-xs text-zinc-500">{j.userId.slice(0, 8)}…</span>
                    )}
                  </td>
                  <td className="max-w-[200px] px-4 py-3 text-zinc-700">{truncate(j.question)}</td>
                  <td className="px-4 py-3 text-zinc-700">{j.totalTokens || "—"}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/chat-jobs/${j.id}`}
                      className="text-sm font-semibold text-violet-700 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {total > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-600">
          <p>
            {total} job{total === 1 ? "" : "s"} · page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex h-9 items-center rounded-lg border border-zinc-300 bg-white px-3 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Prev
            </button>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex h-9 items-center rounded-lg border border-zinc-300 bg-white px-3 disabled:opacity-50"
            >
              Next
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      ) : null}

      {!loading && jobs.length === 0 && total === 0 ? (
        <p className="flex items-center gap-2 text-xs text-zinc-500">
          <MessageSquare className="h-4 w-4" aria-hidden />
          Jobs appear here when users run chat, RAG, or translate tasks.
        </p>
      ) : null}
    </div>
  );
}
