"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { joinServerApiPath } from "@/lib/server-api";
import { toastError } from "@/lib/app-toast";
import { useSapAi } from "@/app/providers/sapai-provider";

export type AdminUserPlanRef = {
  id: string;
  slug: string;
  name: string;
} | null;

export type AdminUserRow = {
  id: string;
  email: string;
  emailMasked: string;
  isAdmin: boolean;
  isEmailVerified: boolean;
  isBlocked: boolean;
  plan: AdminUserPlanRef;
  createdAt: string | null;
  updatedAt: string | null;
};

type ApiOk = {
  success: true;
  data: { users: AdminUserRow[]; page: number; limit: number; total: number };
  error: null;
};
type ApiFail = { success: false; data: null; error: { message: string; code: string } };

export function useAdminUsers() {
  const { token } = useSapAi();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : null),
    [token],
  );

  const load = useCallback(async () => {
    if (!authHeaders) return;
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams();
      qs.set("page", String(page));
      qs.set("limit", String(limit));
      if (query.trim()) qs.set("q", query.trim());
      const res = await fetch(joinServerApiPath(`/api/v1/admin/users?${qs.toString()}`), {
        method: "GET",
        headers: authHeaders,
      });
      const payload = (await res.json()) as ApiOk | ApiFail;
      if (!res.ok || !payload?.success) {
        throw new Error((payload as ApiFail)?.error?.message ?? "Failed to load users.");
      }
      setUsers(payload.data.users ?? []);
      setTotal(payload.data.total ?? 0);
    } catch (e) {
      setUsers([]);
      setTotal(0);
      const msg = e instanceof Error ? e.message : "Failed to load users.";
      setError(msg);
      toastError(msg, { id: "admin-users-list" });
    } finally {
      setLoading(false);
    }
  }, [authHeaders, page, limit, query]);

  useEffect(() => {
    if (!authHeaders) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [authHeaders, load]);

  const patchUser = useCallback(
    async (
      userId: string,
      patch: Partial<{ planId: string | null; isBlocked: boolean }>,
    ) => {
      if (!authHeaders) throw new Error("Not authenticated.");
      const res = await fetch(joinServerApiPath(`/api/v1/admin/users/${encodeURIComponent(userId)}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(patch),
      });
      const payload = (await res.json()) as { success?: boolean; error?: { message?: string } };
      if (!res.ok || !payload?.success) {
        throw new Error(payload?.error?.message ?? "Failed to update user.");
      }
      await load();
    },
    [authHeaders, load],
  );

  const sendPasswordReset = useCallback(
    async (userId: string) => {
      if (!authHeaders) throw new Error("Not authenticated.");
      const res = await fetch(
        joinServerApiPath(`/api/v1/admin/users/${encodeURIComponent(userId)}/send-password-reset`),
        { method: "POST", headers: authHeaders },
      );
      const payload = (await res.json()) as { success?: boolean; error?: { message?: string } };
      if (!res.ok || !payload?.success) {
        throw new Error(payload?.error?.message ?? "Failed to send reset email.");
      }
    },
    [authHeaders],
  );

  const setPassword = useCallback(
    async (userId: string, newPassword: string) => {
      if (!authHeaders) throw new Error("Not authenticated.");
      const res = await fetch(
        joinServerApiPath(`/api/v1/admin/users/${encodeURIComponent(userId)}/set-password`),
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({ newPassword }),
        },
      );
      const payload = (await res.json()) as { success?: boolean; error?: { message?: string } };
      if (!res.ok || !payload?.success) {
        throw new Error(payload?.error?.message ?? "Failed to set password.");
      }
    },
    [authHeaders],
  );

  return {
    users,
    loading,
    error,
    refetch: load,
    patchUser,
    sendPasswordReset,
    setPassword,
    hasAuth: Boolean(authHeaders),
    page,
    setPage,
    limit,
    setLimit,
    total,
    query,
    setQuery,
  };
}

