"use client";

import { useCallback, useMemo, useState } from "react";

import { toastError } from "@/lib/app-toast";
import {
  getRecaptchaToken,
  isRecaptchaEnabledOnClient,
  RECAPTCHA_EMBED_CHAT_ACTION,
} from "@/lib/recaptcha-client";
import {
  formatChatJobCreateError,
  getRagApiBaseUrl,
  parseCreateJobId,
  parseCreateJobSession,
  RAG_JOB_WAIT_TIMEOUT_MS,
  waitForRagJobAnswer,
  type CreateJobResponse,
  type ChatSessionMeta,
} from "@/lib/waitForRagJobAnswer";

export type EmbedRagRunResult =
  | { ok: true; answer: string; session?: ChatSessionMeta }
  | { ok: false; message: string };

export function useEmbedRagChat(embedToken: string) {
  const baseUrl = useMemo(() => getRagApiBaseUrl(), []);
  const [running, setRunning] = useState(false);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");

  const run = useCallback(
    async (question: string, sessionId?: string): Promise<EmbedRagRunResult> => {
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
        let recaptchaToken: string | undefined;
        if (isRecaptchaEnabledOnClient()) {
          const tokenFromRecaptcha = await getRecaptchaToken(RECAPTCHA_EMBED_CHAT_ACTION);
          if (!tokenFromRecaptcha) {
            throw new Error("reCAPTCHA verification is required but not configured.");
          }
          recaptchaToken = tokenFromRecaptcha;
        }

        const sid = sessionId?.trim();
        const res = await fetch(`${baseUrl}/api/v1/embed/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-embed-token": token,
          },
          body: JSON.stringify({
            message: q,
            ...(sid ? { sessionId: sid } : {}),
            ...(recaptchaToken ? { recaptchaToken } : {}),
          }),
        });

        const create = (await res.json().catch(() => null)) as CreateJobResponse | null;
        const jobId = parseCreateJobId(create);
        if (!res.ok || !jobId) {
          throw new Error(formatChatJobCreateError(create));
        }

        const session = parseCreateJobSession(create) ?? undefined;
        const text = await waitForRagJobAnswer(baseUrl, jobId, { kind: "embed", embedToken: token });
        setAnswer(text);
        return { ok: true, answer: text, session };
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
