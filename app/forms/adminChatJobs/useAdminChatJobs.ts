"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { joinServerApiPath } from "@/lib/server-api";
import { toastError } from "@/lib/app-toast";
import { useSapAi } from "@/app/providers/sapai-provider";

export type AdminChatJobSummary = {
  id: string;
  userId: string;
  userEmail: string | null;
  plan: string;
  apiKeyId: string;
  taskType: string;
  status: string;
  model: string;
  maxTokens: number;
  useDeepSeek: boolean | null;
  attempts: number;
  maxAttempts: number;
  question: string | null;
  totalTokens: number;
  errorCode: string | null;
  ragAnswerable: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AdminChatJobFilters = {
  taskType: string;
  status: string;
  userEmail: string;
  userId: string;
  apiKeyId: string;
  plan: string;
};

export const CHAT_JOB_STATUSES = [
  "pending",
  "queued",
  "running",
  "completed_partial",
  "completed_full",
  "failed",
  "cancelled",
] as const;

export const CHAT_TASK_TYPES = ["chat", "rag", "translate"] as const;

export const EMPTY_CHAT_JOB_FILTERS: AdminChatJobFilters = {
  taskType: "",
  status: "",
  userEmail: "",
  userId: "",
  apiKeyId: "",
  plan: "",
};

type ApiOk = {
  success: true;
  data: { jobs: AdminChatJobSummary[]; page: number; limit: number; total: number };
  error: null;
};
type ApiFail = { success: false; data: null; error: { message: string; code: string } };

export function useAdminChatJobs() {
  const { token } = useSapAi();
  const [jobs, setJobs] = useState<AdminChatJobSummary[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<AdminChatJobFilters>(EMPTY_CHAT_JOB_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<AdminChatJobFilters>(EMPTY_CHAT_JOB_FILTERS);
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
      if (appliedFilters.taskType) qs.set("taskType", appliedFilters.taskType);
      if (appliedFilters.status) qs.set("status", appliedFilters.status);
      if (appliedFilters.userEmail.trim()) qs.set("userEmail", appliedFilters.userEmail.trim());
      if (appliedFilters.userId.trim()) qs.set("userId", appliedFilters.userId.trim());
      if (appliedFilters.apiKeyId.trim()) qs.set("apiKeyId", appliedFilters.apiKeyId.trim());
      if (appliedFilters.plan.trim()) qs.set("plan", appliedFilters.plan.trim());

      const res = await fetch(joinServerApiPath(`/api/v1/admin/chat-jobs?${qs.toString()}`), {
        method: "GET",
        headers: authHeaders,
      });
      const payload = (await res.json()) as ApiOk | ApiFail;
      if (!res.ok || !payload?.success) {
        throw new Error((payload as ApiFail)?.error?.message ?? "Failed to load chat jobs.");
      }
      setJobs(payload.data.jobs ?? []);
      setTotal(payload.data.total ?? 0);
    } catch (e) {
      setJobs([]);
      setTotal(0);
      const msg = e instanceof Error ? e.message : "Failed to load chat jobs.";
      setError(msg);
      toastError(msg, { id: "admin-chat-jobs-list" });
    } finally {
      setLoading(false);
    }
  }, [authHeaders, page, limit, appliedFilters]);

  useEffect(() => {
    if (!authHeaders) return;
    void load();
  }, [authHeaders, load]);

  const applyFilters = useCallback(() => {
    setPage(1);
    setAppliedFilters({ ...filters });
  }, [filters]);

  const resetFilters = useCallback(() => {
    setFilters(EMPTY_CHAT_JOB_FILTERS);
    setAppliedFilters(EMPTY_CHAT_JOB_FILTERS);
    setPage(1);
  }, []);

  return {
    jobs,
    loading,
    error,
    refetch: load,
    hasAuth: Boolean(authHeaders),
    page,
    setPage,
    limit,
    setLimit,
    total,
    filters,
    setFilters,
    applyFilters,
    resetFilters,
  };
}
