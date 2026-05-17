"use client";

import { useCallback, useMemo, useState } from "react";

import { toastError } from "@/lib/app-toast";

/** Max time to wait for job completion (Ollama/model cold start + inference can exceed 1–2 min). */
const RAG_JOB_WAIT_TIMEOUT_MS = 10 * 60 * 1000;

/** Must match server `ALLOWED_CHAT_MODEL_IDS` labels (see server `chatModels.ts`). */
const RAG_TEST_MODEL_LABEL = "OCT3Q";

const FALLBACK_POLL_MS = 2000;

type CreateJobResponse = {
  ok?: boolean;
  job?: { id?: string; status?: string };
  message?: string;
  issues?: {
    formErrors?: string[];
    fieldErrors?: Record<string, string[]>;
  };
};

type PublicJob = {
  id?: string;
  status?: string;
  result?: { text?: string | null };
  error?: { message?: string | null };
};

function readStandaloneBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_STANDALONE_API_URL?.trim() || "http://localhost:8000";
  return raw.replace(/\/$/, "");
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

function formatChatJobCreateError(payload: CreateJobResponse | null): string {
  const base = payload?.message?.trim() || "Failed to create chat job.";
  const fieldErrors = payload?.issues?.fieldErrors;
  if (fieldErrors && typeof fieldErrors === "object") {
    const [field, messages] = Object.entries(fieldErrors)[0] ?? [];
    const first = Array.isArray(messages) ? messages[0] : undefined;
    if (field && first) return `${base} (${field}: ${first})`;
  }
  const form = payload?.issues?.formErrors;
  if (Array.isArray(form) && form[0]) return `${base} (${form[0]})`;
  return base;
}

function buildChatJobStreamWsUrlEmbed(baseUrl: string, jobId: string, embedToken: string): string {
  const wsBase = baseUrl.replace(/^https:\/\//i, "wss://").replace(/^http:\/\//i, "ws://");
  return `${wsBase}/api/v1/chat/jobs/${encodeURIComponent(jobId)}/stream?embedToken=${encodeURIComponent(embedToken)}`;
}

async function fetchPublicJobEmbed(
  baseUrl: string,
  jobId: string,
  embedToken: string,
): Promise<PublicJob | null> {
  const jr = await fetch(`${baseUrl}/api/v1/chat/jobs/${encodeURIComponent(jobId)}`, {
    method: "GET",
    headers: { "x-embed-token": embedToken },
  });
  const job = (await jr.json().catch(() => null)) as PublicJob | null;
  if (!jr.ok || !job) return null;
  return job;
}

async function waitForRagJobAnswerEmbed(
  baseUrl: string,
  jobId: string,
  embedToken: string,
  deadline: number,
): Promise<string> {
  let done = false;
  let ws: WebSocket | null = null;
  let fallbackStarted = false;

  const cleanupWs = () => {
    if (!ws) return;
    try {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    } catch {
      /* ignore */
    }
    ws = null;
  };

  return new Promise<string>((resolve, reject) => {
    let timeoutHandle: ReturnType<typeof setTimeout>;

    const fail = (msg: string) => {
      if (done) return;
      done = true;
      clearTimeout(timeoutHandle);
      cleanupWs();
      reject(new Error(msg));
    };

    const succeedWithText = (text: string) => {
      if (done) return;
      done = true;
      clearTimeout(timeoutHandle);
      cleanupWs();
      resolve(text);
    };

    const handleJob = (job: PublicJob | null): void => {
      if (!job?.status || done) return;
      const status = job.status;
      if (status === "completed_partial" || status === "completed_full" || status === "completed") {
        succeedWithText(job.result?.text?.trim() || "");
        return;
      }
      if (status === "failed" || status === "cancelled") {
        fail(job.error?.message || "Job failed.");
      }
    };

    const startFallbackPoll = () => {
      if (fallbackStarted || done) return;
      fallbackStarted = true;
      void (async () => {
        while (!done && Date.now() < deadline) {
          await sleep(FALLBACK_POLL_MS);
          if (done) return;
          try {
            const job = await fetchPublicJobEmbed(baseUrl, jobId, embedToken);
            handleJob(job);
          } catch {
            /* keep polling until deadline */
          }
        }
      })();
    };

    timeoutHandle = setTimeout(() => {
      fail(
        `Timed out after ${Math.round(RAG_JOB_WAIT_TIMEOUT_MS / 60_000)} minutes waiting for the answer. Try again if the model was still loading.`,
      );
    }, Math.max(0, deadline - Date.now()));

    try {
      ws = new WebSocket(buildChatJobStreamWsUrlEmbed(baseUrl, jobId, embedToken));
    } catch {
      startFallbackPoll();
      return;
    }

    ws.onmessage = (ev) => {
      try {
        const job = JSON.parse(String(ev.data)) as PublicJob;
        handleJob(job);
      } catch {
        /* ignore non-JSON */
      }
    };

    ws.onerror = () => {
      if (!done) startFallbackPoll();
    };

    ws.onclose = () => {
      if (done) return;
      void fetchPublicJobEmbed(baseUrl, jobId, embedToken).then((job) => {
        if (done) return;
        handleJob(job);
        if (!done) startFallbackPoll();
      });
    };
  });
}

export type EmbedRagRunResult =
  | { ok: true; answer: string }
  | { ok: false; message: string };

export function useEmbedRagChat(embedToken: string) {
  const baseUrl = useMemo(() => readStandaloneBaseUrl(), []);
  const [running, setRunning] = useState(false);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");

  const run = useCallback(
    async (question: string): Promise<EmbedRagRunResult> => {
      const q = question.trim();
      const token = embedToken.trim();
      if (!q) {
        const message = "Enter a question.";
        setError(message);
        toastError(message, { id: "embed-rag-chat" });
        return { ok: false, message };
      }
      if (!token) {
        const message = "Missing embed token.";
        setError(message);
        toastError(message, { id: "embed-rag-chat" });
        return { ok: false, message };
      }

      setRunning(true);
      setAnswer("");
      setError("");

      try {
        const res = await fetch(`${baseUrl}/api/v1/embed/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-embed-token": token,
          },
          body: JSON.stringify({
            message: q,
            model: RAG_TEST_MODEL_LABEL,
          }),
        });

        const create = (await res.json().catch(() => null)) as CreateJobResponse | null;
        if (!res.ok || !create?.ok || !create.job?.id) {
          throw new Error(formatChatJobCreateError(create));
        }

        const jobId = create.job.id;
        const deadline = Date.now() + RAG_JOB_WAIT_TIMEOUT_MS;

        const text = await waitForRagJobAnswerEmbed(baseUrl, jobId, token, deadline);
        setAnswer(text);
        return { ok: true, answer: text };
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Request failed.";
        setError(msg);
        toastError(msg, { id: "embed-rag-chat" });
        return { ok: false, message: msg };
      } finally {
        setRunning(false);
      }
    },
    [baseUrl, embedToken],
  );

  return { baseUrl, running, answer, error, run, setAnswer, setError };
}
