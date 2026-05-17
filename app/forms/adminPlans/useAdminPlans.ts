"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useSapAi } from "@/app/providers/sapai-provider";
import { toastError, toastSuccess } from "@/lib/app-toast";
import { joinServerApiPath } from "@/lib/server-api";

import type { AdminPlan, AdminPlanInput } from "./types";
import { inputToCreateBody, inputToPatchBody } from "./types";

type ApiOk<T> = { success: true; data: T; error: null };
type ApiFail = { success: false; data: null; error: { message: string; code: string } };

async function parseApi<T>(res: Response): Promise<T> {
  const payload = (await res.json()) as ApiOk<T> | ApiFail;
  if (!res.ok || !payload.success) {
    throw new Error(payload.error?.message ?? "Request failed.");
  }
  return payload.data;
}

export function useAdminPlans() {
  const { token } = useSapAi();
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const authHeaders = useMemo((): HeadersInit | null => {
    if (!token) return null;
    return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  }, [token]);

  const load = useCallback(async () => {
    if (!authHeaders) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(joinServerApiPath("/api/v1/admin/plans"), { headers: authHeaders });
      const data = await parseApi<{ plans: AdminPlan[] }>(res);
      setPlans(data.plans);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load plans.";
      setError(msg);
      toastError(msg, { id: "admin-plans-list" });
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createPlan(input: AdminPlanInput) {
    if (!authHeaders) return;
    setSaving(true);
    try {
      const res = await fetch(joinServerApiPath("/api/v1/admin/plans"), {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(inputToCreateBody(input)),
      });
      await parseApi<{ plan: AdminPlan }>(res);
      toastSuccess("Plan created.", { id: "admin-plans-save" });
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Create failed.";
      toastError(msg, { id: "admin-plans-save" });
      throw e;
    } finally {
      setSaving(false);
    }
  }

  async function updatePlan(id: string, input: AdminPlanInput) {
    if (!authHeaders) return;
    setSaving(true);
    try {
      const res = await fetch(joinServerApiPath(`/api/v1/admin/plans/${encodeURIComponent(id)}`), {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify(inputToPatchBody(input)),
      });
      await parseApi<{ plan: AdminPlan }>(res);
      toastSuccess("Plan updated.", { id: "admin-plans-save" });
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Update failed.";
      toastError(msg, { id: "admin-plans-save" });
      throw e;
    } finally {
      setSaving(false);
    }
  }

  async function deletePlan(id: string) {
    if (!authHeaders) return;
    setSaving(true);
    try {
      const res = await fetch(joinServerApiPath(`/api/v1/admin/plans/${encodeURIComponent(id)}`), {
        method: "DELETE",
        headers: authHeaders,
      });
      await parseApi<{ message: string }>(res);
      toastSuccess("Plan deleted.", { id: "admin-plans-delete" });
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Delete failed.";
      toastError(msg, { id: "admin-plans-delete" });
      throw e;
    } finally {
      setSaving(false);
    }
  }

  return {
    plans,
    loading,
    saving,
    error,
    hasAuth: Boolean(authHeaders),
    refetch: load,
    createPlan,
    updatePlan,
    deletePlan,
  };
}
