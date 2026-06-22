"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Ban, KeyRound, Mail, RefreshCw, Send, Shield } from "lucide-react";
import { toastError, toastSuccess } from "@/lib/app-toast";
import { useAdminPlans } from "@/app/forms/adminPlans/useAdminPlans";
import { SearchableSelect } from "@/app/components/SearchableSelect";
import { useAdminUsers, type AdminUserRow } from "./useAdminUsers";
import { useAdminUser } from "./useAdminUser";

function badge(ok: boolean) {
  return ok
    ? `rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700`
    : `rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-semibold text-zinc-600`;
}

function statCard(label: string, value: string, hint?: string) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-zinc-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-zinc-600">{hint}</p> : null}
    </div>
  );
}

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default function AdminUserDetailsPanel({ userId }: { userId: string }) {
  const { user, loading, error, refetch, hasAuth } = useAdminUser(userId);
  const { patchUser, sendPasswordReset, setPassword } = useAdminUsers();
  const { plans, loading: plansLoading } = useAdminPlans();

  const [saving, setSaving] = useState(false);
  const [resetSending, setResetSending] = useState(false);
  const [pw, setPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [expiryMode, setExpiryMode] = useState<"never" | "date">("never");
  const [expiryDate, setExpiryDate] = useState("");

  const defaultPlan = useMemo(() => plans.find((p) => p.isDefault), [plans]);
  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === selectedPlanId),
    [plans, selectedPlanId],
  );
  const isNonDefaultPlan = Boolean(selectedPlan && !selectedPlan.isDefault);

  const planOptions = useMemo(
    () =>
      plans.map((p) => ({
        value: p.id,
        label: `${p.name} (${p.slug})${p.isDefault ? " — default" : ""}`,
      })),
    [plans],
  );

  useEffect(() => {
    if (!user) return;
    setSelectedPlanId(user.plan?.id ?? "");
    if (user.planExpiresAt) {
      setExpiryMode("date");
      setExpiryDate(toDateInputValue(user.planExpiresAt));
    } else {
      setExpiryMode("never");
      setExpiryDate("");
    }
  }, [user]);

  async function onSavePlan() {
    if (!selectedPlanId && !defaultPlan) {
      toastError("No default plan configured.", { id: "admin-user-action" });
      return;
    }
    if (isNonDefaultPlan && expiryMode === "date" && !expiryDate.trim()) {
      toastError("Pick an expiry date or choose Never expires.", { id: "admin-user-action" });
      return;
    }

    setSaving(true);
    try {
      await patchUser(userId, {
        planId: selectedPlanId || null,
        planExpiresAt: isNonDefaultPlan ? (expiryMode === "never" ? null : expiryDate) : null,
      });
      toastSuccess("Plan updated.", { id: "admin-user-action" });
      await refetch();
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed.", { id: "admin-user-action" });
    } finally {
      setSaving(false);
    }
  }

  async function onToggleBlocked(next: boolean) {
    setSaving(true);
    try {
      await patchUser(userId, { isBlocked: next });
      toastSuccess(next ? "User blocked." : "User unblocked.", { id: "admin-user-action" });
      await refetch();
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed.", { id: "admin-user-action" });
    } finally {
      setSaving(false);
    }
  }

  async function onSendReset() {
    setResetSending(true);
    try {
      await sendPasswordReset(userId);
      toastSuccess("Reset email sent.", { id: "admin-user-action" });
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed.", { id: "admin-user-action" });
    } finally {
      setResetSending(false);
    }
  }

  async function onSetPassword() {
    const next = pw.trim();
    if (!next) return;
    const ok = window.confirm("Set a new password for this user?");
    if (!ok) return;
    setPwSaving(true);
    try {
      await setPassword(userId, next);
      setPw("");
      toastSuccess("Password updated.", { id: "admin-user-action" });
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed.", { id: "admin-user-action" });
    } finally {
      setPwSaving(false);
    }
  }

  if (!hasAuth) {
    return (
      <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Authentication required (admin).
      </p>
    );
  }

  if (loading) return <p className="mt-6 text-sm text-zinc-600">Loading user…</p>;
  if (error) {
    return (
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <p className="text-sm text-zinc-600">{error}</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
        >
          Retry
        </button>
      </div>
    );
  }
  if (!user) {
    return (
      <p className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
        User not found.
      </p>
    );
  }

  const u: AdminUserRow = user;
  const planLabel = u.plan ? `${u.plan.name} (${u.plan.slug})` : "No plan assigned";
  const expiryLabel = u.planExpiresAt
    ? new Date(u.planExpiresAt).toLocaleDateString()
    : u.plan && !u.isPlanExpired
      ? "Never"
      : "—";
  const effectiveLabel = u.isPlanExpired && u.effectivePlan
    ? `${u.effectivePlan.name} (expired)`
    : planLabel;

  return (
    <div className="mt-6 space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-amber-200/25 blur-3xl" />

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">User</p>
            <h2 className="mt-2 flex min-w-0 flex-wrap items-center gap-2 text-xl font-semibold text-zinc-900">
              <span className="truncate">{u.email}</span>
              {u.isAdmin ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                  <Shield className="h-3.5 w-3.5" aria-hidden />
                  Admin
                </span>
              ) : null}
            </h2>
            <p className="mt-1 text-xs text-zinc-500">ID: {u.id}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void refetch()}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50"
            >
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
              Refresh
            </button>
            <Link
              href="/admin/users"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50"
            >
              Back
            </Link>
          </div>
        </div>

        <div className="relative mt-4 flex flex-wrap items-center gap-2">
          <span className={badge(!u.isBlocked)}>{u.isBlocked ? "Blocked" : "Active"}</span>
          <span className={badge(u.isEmailVerified)}>{u.isEmailVerified ? "Verified" : "Unverified"}</span>
          {u.isPlanExpired ? (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
              Plan expired
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {statCard("Assigned plan", planLabel, u.isPlanExpired ? `Effective: ${effectiveLabel}` : undefined)}
        {statCard("Plan expires", expiryLabel, u.isPlanExpired ? "Downgraded to default plan" : undefined)}
        {statCard("Member since", u.createdAt ? new Date(u.createdAt).toLocaleDateString() : " ")}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-zinc-900">Plan & access</h3>
            <p className="mt-1 text-xs text-zinc-600">
              Non-default plans require an expiry (never or a date). Default plan never expires.
            </p>

            <div className="mt-4 space-y-4">
              <div className="max-w-md">
                {plansLoading && planOptions.length === 0 ? (
                  <p className="text-sm text-zinc-600">Loading plans…</p>
                ) : planOptions.length === 0 ? (
                  <p className="text-sm text-amber-800">
                    No plans in the database. Create plans under{" "}
                    <Link href="/admin/plans" className="font-semibold underline">
                      Admin → Plans
                    </Link>
                    .
                  </p>
                ) : (
                  <SearchableSelect
                    label="Plan"
                    ui="square"
                    value={selectedPlanId}
                    options={planOptions}
                    disabled={saving}
                    onChange={setSelectedPlanId}
                  />
                )}
              </div>

              {isNonDefaultPlan ? (
                <fieldset className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4">
                  <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Plan expiry
                  </legend>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-800">
                    <input
                      type="radio"
                      name="expiryMode"
                      checked={expiryMode === "never"}
                      disabled={saving}
                      onChange={() => setExpiryMode("never")}
                      className="h-4 w-4 border-zinc-300 text-violet-600 focus:ring-violet-500"
                    />
                    Never expires
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-800">
                    <input
                      type="radio"
                      name="expiryMode"
                      checked={expiryMode === "date"}
                      disabled={saving}
                      onChange={() => setExpiryMode("date")}
                      className="h-4 w-4 border-zinc-300 text-violet-600 focus:ring-violet-500"
                    />
                    Expires on
                  </label>
                  {expiryMode === "date" ? (
                    <input
                      type="date"
                      value={expiryDate}
                      disabled={saving}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="h-10 rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                    />
                  ) : null}
                </fieldset>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={saving || planOptions.length === 0}
                  onClick={() => void onSavePlan()}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-70"
                >
                  Save plan
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void onToggleBlocked(!u.isBlocked)}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 disabled:opacity-70"
                >
                  <Ban className="mr-2 h-4 w-4" aria-hidden />
                  {u.isBlocked ? "Unblock" : "Block"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-zinc-900">Password reset email</h3>
            <p className="mt-1 text-xs text-zinc-600">Send OTP reset link to the user’s email.</p>
            <button
              type="button"
              disabled={resetSending}
              onClick={() => void onSendReset()}
              className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 disabled:opacity-70"
            >
              <Mail className="mr-2 h-4 w-4" aria-hidden />
              Send reset email
            </button>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-zinc-900">Set password</h3>
            <p className="mt-1 text-xs text-zinc-600">Admin-only. Sets a new password immediately.</p>
            <div className="mt-4 flex gap-2">
              <input
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="New password"
                className="h-10 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
              <button
                type="button"
                disabled={pwSaving || !pw.trim()}
                onClick={() => void onSetPassword()}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-violet-600 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-70"
                title="Set password"
              >
                <KeyRound className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <button
              type="button"
              disabled={pwSaving || !pw.trim()}
              onClick={() => void onSetPassword()}
              className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-xl border border-violet-200 bg-violet-50 px-4 text-sm font-semibold text-violet-800 transition hover:bg-violet-100 disabled:opacity-70"
            >
              <Send className="mr-2 h-4 w-4" aria-hidden />
              Apply password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
