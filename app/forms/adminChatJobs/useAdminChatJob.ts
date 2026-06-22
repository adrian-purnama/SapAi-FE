"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { joinServerApiPath } from "@/lib/server-api";
import { toastError } from "@/lib/app-toast";
import { useSapAi } from "@/app/providers/sapai-provider";

export type AdminChatJob = {
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
  input: Array<{ role: string; content: string }>;
  result: {
    text: string | null;
    json: unknown;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  } | null;
  ragAnalysis: {
    category: string | null;
    answerable: string | null;
    intent: string | null;
  } | null;
  error: { message: string | null; code: string | null } | null;
  attempts: number;
  maxAttempts: number;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type ApiOk = { success: true; data: { job: AdminChatJob }; error: null };
type ApiFail = { success: false; data: null; error: { message: string; code: string } };

export function useAdminChatJob(jobId: string) {
  const { token } = useSapAi();
  const [job, setJob] = useState<AdminChatJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : null),
    [token],
  );

  const load = useCallback(async () => {
    if (!authHeaders || !jobId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(joinServerApiPath(`/api/v1/admin/chat-jobs/${encodeURIComponent(jobId)}`), {
        method: "GET",
        headers: authHeaders,
      });
      const payload = (await res.json()) as ApiOk | ApiFail;
      if (!res.ok || !payload?.success) {
        throw new Error((payload as ApiFail)?.error?.message ?? "Failed to load job.");
      }
      setJob(payload.data.job);
    } catch (e) {
      setJob(null);
      const msg = e instanceof Error ? e.message : "Failed to load job.";
      setError(msg);
      toastError(msg, { id: "admin-chat-job-detail" });
    } finally {
      setLoading(false);
    }
  }, [authHeaders, jobId]);

  useEffect(() => {
    if (!authHeaders) return;
    void load();
  }, [authHeaders, load]);

  return { job, loading, error, refetch: load, hasAuth: Boolean(authHeaders) };
}
