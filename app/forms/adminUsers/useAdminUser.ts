"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { joinServerApiPath } from "@/lib/server-api";
import { toastError } from "@/lib/app-toast";
import { useSapAi } from "@/app/providers/sapai-provider";
import type { AdminUserPlanHistoryEntry, AdminUserRow } from "./useAdminUsers";

type ApiOk = { success: true; data: { user: AdminUserRow; planHistory?: AdminUserPlanHistoryEntry[] }; error: null };
type ApiFail = { success: false; data: null; error: { message: string; code: string } };

export function useAdminUser(userId: string) {
  const { token } = useSapAi();
  const [user, setUser] = useState<AdminUserRow | null>(null);
  const [planHistory, setPlanHistory] = useState<AdminUserPlanHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : null),
    [token],
  );

  const load = useCallback(async () => {
    if (!authHeaders) return;
    if (!userId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(joinServerApiPath(`/api/v1/admin/users/${encodeURIComponent(userId)}`), {
        method: "GET",
        headers: authHeaders,
      });
      const payload = (await res.json()) as ApiOk | ApiFail;
      if (!res.ok || !payload?.success) {
        throw new Error((payload as ApiFail)?.error?.message ?? "Failed to load user.");
      }
      setUser(payload.data.user);
      setPlanHistory(Array.isArray(payload.data.planHistory) ? payload.data.planHistory : []);
    } catch (e) {
      setUser(null);
      setPlanHistory([]);
      const msg = e instanceof Error ? e.message : "Failed to load user.";
      setError(msg);
      toastError(msg, { id: "admin-user-detail" });
    } finally {
      setLoading(false);
    }
  }, [authHeaders, userId]);

  useEffect(() => {
    if (!authHeaders) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [authHeaders, load]);

  return { user, planHistory, loading, error, refetch: load, hasAuth: Boolean(authHeaders) };
}

