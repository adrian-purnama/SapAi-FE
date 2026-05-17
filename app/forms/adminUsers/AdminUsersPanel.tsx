"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight, KeyRound, RefreshCw, Search, Users } from "lucide-react";
import { toastError, toastSuccess } from "@/lib/app-toast";
import { joinServerApiPath } from "@/lib/server-api";
import { useSapAi } from "@/app/providers/sapai-provider";
import { useAdminPlans } from "@/app/forms/adminPlans/useAdminPlans";
import { useAdminUsers, type AdminUserRow } from "./useAdminUsers";

function initials(email: string) {
  const local = (email.split("@")[0] ?? "").trim();
  if (!local) return "?";
  const parts = local.split(/[._-]+/g).filter(Boolean);
  const a = parts[0]?.[0] ?? local[0] ?? "?";
  const b = parts.length > 1 ? parts[1]?.[0] : local.length > 1 ? local[1] : "";
  return (a + b).toUpperCase();
}

function statusPill(kind: "ok" | "warn" | "bad" | "muted" | "accent", label: string) {
  const styles = {
    ok: "border-emerald-200 bg-emerald-50 text-emerald-800",
    warn: "border-amber-200 bg-amber-50 text-amber-900",
    bad: "border-red-200 bg-red-50 text-red-800",
    muted: "border-zinc-200 bg-zinc-50 text-zinc-600",
    accent: "border-violet-200 bg-violet-50 text-violet-800",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${styles[kind]}`}
    >
      {label}
    </span>
  );
}

function planSelectClass(slug: string | undefined) {
  if (slug === "scale") return "border-amber-200 bg-amber-50/50 text-amber-950";
  if (slug === "pro") return "border-violet-200 bg-violet-50/50 text-violet-950";
  return "border-zinc-200 bg-white text-zinc-900";
}

function PlanCell({
  user,
  plans,
  plansReady,
  saving,
  onPlanChange,
}: {
  user: AdminUserRow;
  plans: Array<{ id: string; name: string; slug: string }>;
  plansReady: boolean;
  saving: boolean;
  onPlanChange: (userId: string, planId: string) => void;
}) {
  if (!plansReady) {
    return <span className="text-xs text-zinc-500">Loading plans…</span>;
  }
  if (plans.length === 0) {
    return (
      <Link href="/admin/plans" className="text-xs font-semibold text-violet-700 hover:text-violet-900">
        Create plans first →
      </Link>
    );
  }

  return (
    <select
      value={user.plan?.id ?? ""}
      disabled={saving}
      onChange={(e) => onPlanChange(user.id, e.target.value)}
      className={[
        "h-9 max-w-[200px] rounded-lg border px-2.5 text-sm font-medium shadow-sm",
        "focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400",
        "disabled:cursor-wait disabled:opacity-60",
        planSelectClass(user.plan?.slug),
      ].join(" ")}
      aria-label={`Plan for ${user.email}`}
    >
      <option value="">No plan</option>
      {plans.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  );
}

export default function AdminUsersPanel() {
  const {
    users,
    loading,
    error,
    refetch,
    patchUser,
    hasAuth,
    page,
    setPage,
    limit,
    setLimit,
    total,
    query,
    setQuery,
  } = useAdminUsers();
  const { plans, loading: plansLoading } = useAdminPlans();
  const { token } = useSapAi();
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [syncingKeys, setSyncingKeys] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, limit)));
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const plansReady = !plansLoading;

  async function handlePlanChange(userId: string, planId: string) {
    setSavingUserId(userId);
    try {
      await patchUser(userId, { planId: planId || null });
      toastSuccess("Plan updated.", { id: "admin-users-plan" });
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to update plan.", {
        id: "admin-users-plan",
      });
    } finally {
      setSavingUserId(null);
    }
  }

  async function handleSyncAllApiKeys() {
    if (!token) return;
    if (
      !window.confirm(
        "Sync all users' API keys to their current plans? This sets one primary key per user and disables keys over the plan limit.",
      )
    ) {
      return;
    }
    setSyncingKeys(true);
    try {
      const res = await fetch(joinServerApiPath("/api/v1/admin/api-keys/sync-plans"), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await res.json();
      if (!res.ok || !payload?.success) {
        throw new Error(payload?.error?.message ?? "Sync failed.");
      }
      const d = payload.data as {
        usersProcessed?: number;
        keysEnabled?: number;
        keysDisabled?: number;
        primariesAssigned?: number;
      };
      toastSuccess(
        `Synced ${d.usersProcessed ?? 0} user(s): ${d.keysEnabled ?? 0} enabled, ${d.keysDisabled ?? 0} disabled, ${d.primariesAssigned ?? 0} primary assigned.`,
        { id: "admin-api-key-sync" },
      );
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Sync failed.", { id: "admin-api-key-sync" });
    } finally {
      setSyncingKeys(false);
    }
  }

  return (
    <section className="mt-8">
      {!hasAuth ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Sign in as an admin to manage users.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 bg-zinc-50/80 px-4 py-4 sm:px-5">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700">
                <Users className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold text-zinc-900">
                  {loading ? "Loading…" : `${total.toLocaleString()} users`}
                </p>
                <p className="text-xs text-zinc-500">Page {page} of {totalPages}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void handleSyncAllApiKeys()}
                disabled={syncingKeys || loading}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-violet-200 bg-violet-50 px-3 text-sm font-semibold text-violet-900 transition hover:bg-violet-100 disabled:opacity-60"
              >
                <KeyRound className={`mr-2 h-4 w-4 ${syncingKeys ? "animate-pulse" : ""}`} aria-hidden />
                {syncingKeys ? "Syncing…" : "Sync API keys to plans"}
              </button>
              <button
                type="button"
                onClick={() => void refetch()}
                disabled={loading}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 disabled:opacity-60"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden />
                Refresh
              </button>
            </div>
          </div>

          <div className="grid gap-3 border-b border-zinc-100 p-4 sm:grid-cols-[1fr_auto] sm:items-end sm:px-5">
            <label className="grid gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Search</span>
              <div className="flex h-10 items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 shadow-sm focus-within:border-zinc-500 focus-within:ring-1 focus-within:ring-zinc-400">
                <Search className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Email address…"
                  className="w-full bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
                />
              </div>
            </label>
            <label className="grid gap-1 sm:w-28">
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Per page</span>
              <select
                value={String(limit)}
                onChange={(e) => {
                  setLimit(Number(e.target.value) || 25);
                  setPage(1);
                }}
                className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={String(n)}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error ? (
            <div className="flex flex-wrap items-center gap-3 px-5 py-8">
              <p className="text-sm text-zinc-600">{error}</p>
              <button
                type="button"
                onClick={() => void refetch()}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
              >
                Retry
              </button>
            </div>
          ) : loading ? (
            <p className="px-5 py-12 text-center text-sm text-zinc-500">Loading users…</p>
          ) : users.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-zinc-500">
              {query.trim() ? "No users match your search." : "No users yet."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-5 py-3">User</th>
                    <th className="px-5 py-3">Plan</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {users.map((u) => (
                    <tr key={u.id} className="transition hover:bg-zinc-50/80">
                      <td className="px-5 py-3.5">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-xs font-bold text-white">
                            {initials(u.email)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-zinc-900">{u.email}</p>
                            <p className="truncate text-xs text-zinc-500">{u.emailMasked}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <PlanCell
                          user={u}
                          plans={plans}
                          plansReady={plansReady}
                          saving={savingUserId === u.id}
                          onPlanChange={handlePlanChange}
                        />
                        {u.plan ? (
                          <p className="mt-1 font-mono text-[11px] text-zinc-500">{u.plan.slug}</p>
                        ) : null}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1.5">
                          {u.isBlocked ? statusPill("bad", "blocked") : statusPill("ok", "active")}
                          {u.isEmailVerified ? statusPill("muted", "verified") : statusPill("warn", "unverified")}
                          {u.isAdmin ? statusPill("accent", "admin") : null}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          href={`/admin/users/${encodeURIComponent(u.id)}`}
                          className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50"
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 bg-zinc-50/60 px-4 py-3 sm:px-5">
            <p className="text-xs text-zinc-600">
              Plans from{" "}
              <Link href="/admin/plans" className="font-semibold text-zinc-800 hover:underline">
                Admin → Plans
              </Link>
              .
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!canPrev}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 disabled:opacity-60"
              >
                <ChevronLeft className="mr-1 h-4 w-4" aria-hidden />
                Prev
              </button>
              <button
                type="button"
                disabled={!canNext}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 disabled:opacity-60"
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
