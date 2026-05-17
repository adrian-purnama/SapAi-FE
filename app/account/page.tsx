"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import PasswordChecklist from "@/app/components/PasswordChecklist";
import PasswordInput from "@/app/components/PasswordInput";
import { toastError, toastSuccess } from "@/lib/app-toast";
import { joinServerApiPath } from "@/lib/server-api";
import { useSapAi } from "@/app/providers/sapai-provider";

type MePayload = {
  id: string;
  email: string;
  isAdmin: boolean;
  isEmailVerified: boolean;
  isBlocked: boolean;
};

export default function AccountPage() {
  const { token } = useSapAi();
  const [meLoading, setMeLoading] = useState(true);
  const [meLoadFailed, setMeLoadFailed] = useState(false);
  const [me, setMe] = useState<MePayload | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [clientError, setClientError] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  const loadMe = useCallback(
    async (opts?: { signal?: AbortSignal }) => {
      setMeLoading(true);
      setMeLoadFailed(false);
      try {
        const response = await fetch(joinServerApiPath("/api/v1/auth/me"), {
          method: "GET",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          signal: opts?.signal,
        });
        const payload = await response.json();
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error?.message ?? "Failed to load account.");
        }
        setMe(payload.data);
      } catch (err) {
        if (opts?.signal?.aborted) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        const message = err instanceof Error ? err.message : "Failed to load account.";
        setMeLoadFailed(true);
        toastError(message, { id: "account-me" });
      } finally {
        if (!opts?.signal?.aborted) setMeLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    const ac = new AbortController();
    void loadMe({ signal: ac.signal });
    return () => ac.abort();
  }, [loadMe]);

  async function onChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setClientError("");

    if (newPassword !== confirmPassword) {
      setClientError("Passwords do not match.");
      return;
    }

    setSubmitLoading(true);
    try {
      const response = await fetch(joinServerApiPath("/api/v1/auth/change-password"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error?.message ?? "Failed to change password.");
      }
      toastSuccess(payload?.data?.message ?? "Password updated.", { id: "account-password" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to change password.";
      toastError(message, { id: "account-password" });
    } finally {
      setSubmitLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-zinc-900">Account</h1>
        <p className="mt-2 text-zinc-600">Manage your profile and credentials.</p>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Profile</h2>
        {meLoading ? (
          <p className="mt-2 text-zinc-600">Loading…</p>
        ) : meLoadFailed ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <p className="text-sm text-zinc-600">Could not load profile.</p>
            <button
              type="button"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
              onClick={() => void loadMe()}
            >
              Retry
            </button>
          </div>
        ) : me ? (
          <dl className="mt-4 grid gap-3 text-sm">
            <div className="grid grid-cols-[140px_1fr] items-center gap-3">
              <dt className="text-zinc-500">Email</dt>
              <dd className="truncate font-medium text-zinc-900">{me.email}</dd>
            </div>
            <div className="grid grid-cols-[140px_1fr] items-center gap-3">
              <dt className="text-zinc-500">Role</dt>
              <dd className="text-zinc-700">{me.isAdmin ? "Admin" : "User"}</dd>
            </div>
            <div className="grid grid-cols-[140px_1fr] items-center gap-3">
              <dt className="text-zinc-500">Email verified</dt>
              <dd className="text-zinc-700">{me.isEmailVerified ? "Yes" : "No"}</dd>
            </div>
          </dl>
        ) : null}
      </section>

      <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Change password</h2>
        <p className="mt-2 text-sm text-zinc-600">Choose a strong password you do not use elsewhere.</p>

        <form className="mt-6 flex flex-col gap-3" onSubmit={onChangePassword}>
          <PasswordInput
            label="Current password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={setCurrentPassword}
            required
          />

          <PasswordInput
            label="New password"
            autoComplete="new-password"
            minLength={8}
            value={newPassword}
            onChange={setNewPassword}
            required
          />
          <PasswordChecklist password={newPassword} />

          <PasswordInput
            label="Confirm new password"
            autoComplete="new-password"
            minLength={8}
            value={confirmPassword}
            onChange={setConfirmPassword}
            required
          />

          <button
            className="mt-2 h-[42px] cursor-pointer rounded-lg bg-zinc-900 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={submitLoading}
          >
            {submitLoading ? "Saving..." : "Update password"}
          </button>

          {clientError ? <p className="mt-1 text-red-700">{clientError}</p> : null}
        </form>
      </section>
    </main>
  );
}
