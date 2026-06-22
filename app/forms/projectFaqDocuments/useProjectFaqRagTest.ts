"use client";

import { useCallback, useMemo, useState } from "react";

import { toastError } from "@/lib/app-toast";
import {
  formatChatJobCreateError,
  getRagApiBaseUrl,
  parseCreateJobId,
  waitForRagJobAnswer,
  type CreateJobResponse,
} from "@/lib/waitForRagJobAnswer";

export type RagTestRunResult =
  | { ok: true; answer: string }
  | { ok: false; message: string };

export function useProjectFaqRagTest() {
  const baseUrl = useMemo(() => getRagApiBaseUrl(), []);
  const [running, setRunning] = useState(false);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");

  const run = useCallback(
    async (question: string, apiKey: string): Promise<RagTestRunResult> => {
      const q = question.trim();
      const key = apiKey.trim();
      if (!q) {
        const message = "Enter a question.";
        setError(message);
        toastError(message, { id: "faq-rag-test" });
        return { ok: false, message };
      }
      if (!key) {
        const message = "Enter your project API key.";
        setError(message);
        toastError(message, { id: "faq-rag-test" });
        return { ok: false, message };
      }

      setRunning(true);
      setAnswer("");
      setError("");

      try {
        const modelsRes = await fetch(`${baseUrl}/api/v1/chat/models`, {
          headers: { "x-api-key": key },
        });
        const modelsJson = (await modelsRes.json().catch(() => null)) as {
          success?: boolean;
          data?: { modelsByTask?: Record<string, string[]> };
        } | null;
        const ragModel = modelsJson?.data?.modelsByTask?.rag?.[0];
        if (!modelsRes.ok || !ragModel) {
          throw new Error("Could not load allowed RAG models for this API key.");
        }

        const res = await fetch(`${baseUrl}/api/v1/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": key,
          },
          body: JSON.stringify({
            taskType: "rag",
            model: ragModel,
            input: [{ role: "user", content: q }],
            maxTokens: 500,
          }),
        });

        const create = (await res.json().catch(() => null)) as CreateJobResponse | null;
        const jobId = parseCreateJobId(create);
        if (!res.ok || !jobId) {
          throw new Error(formatChatJobCreateError(create));
        }

        const text = await waitForRagJobAnswer(baseUrl, jobId, { kind: "apiKey", apiKey: key });
        setAnswer(text);
        return { ok: true, answer: text };
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Request failed.";
        setError(msg);
        toastError(msg, { id: "faq-rag-test" });
        return { ok: false, message: msg };
      } finally {
        setRunning(false);
      }
    },
    [baseUrl],
  );

  return { baseUrl, running, answer, error, run, setAnswer, setError };
}
