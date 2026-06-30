"use client";

import { useCallback, useMemo, useState } from "react";

import { toastError, toastSuccess } from "@/lib/app-toast";
import {
  createApiKeyChatSession,
  endApiKeyChatSession,
  fetchPublicJobForAuth,
  formatChatJobCreateError,
  getRagApiBaseUrl,
  parseCreateJobId,
  parseCreateJobSession,
  waitForRagJobAnswer,
  type ChatSessionMeta,
  type CreateJobResponse,
} from "@/lib/waitForRagJobAnswer";

export type RagTestMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export type RagTestLastJob = {
  id: string;
  status: string;
};

export type RagTestRunResult =
  | {
      ok: true;
      answer: string;
      jobId: string;
      jobStatus: string;
      session: ChatSessionMeta | null;
    }
  | { ok: false; message: string };

function newMessageId(): string {
  return crypto.randomUUID();
}

export function useProjectFaqRagTest() {
  const baseUrl = useMemo(() => getRagApiBaseUrl(), []);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<RagTestMessage[]>([]);
  const [session, setSession] = useState<ChatSessionMeta | null>(null);
  const [lastJob, setLastJob] = useState<RagTestLastJob | null>(null);

  const resetConversation = useCallback(() => {
    setMessages([]);
    setLastJob(null);
    setError("");
  }, []);

  const startSession = useCallback(
    async (apiKey: string): Promise<ChatSessionMeta | null> => {
      const key = apiKey.trim();
      if (!key) {
        toastError("Enter your project API key first.", { id: "faq-rag-test" });
        return null;
      }
      try {
        const created = await createApiKeyChatSession(baseUrl, key);
        setSession(created);
        setMessages([]);
        setLastJob(null);
        setError("");
        toastSuccess("Chat session created.", { id: "faq-rag-test-session" });
        return created;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to create session.";
        setError(msg);
        toastError(msg, { id: "faq-rag-test-session" });
        return null;
      }
    },
    [baseUrl],
  );

  const endSession = useCallback(
    async (apiKey: string): Promise<void> => {
      const key = apiKey.trim();
      const sid = session?.id?.trim();
      if (!key || !sid) {
        resetConversation();
        return;
      }
      try {
        await endApiKeyChatSession(baseUrl, key, sid);
        toastSuccess("Chat session ended.", { id: "faq-rag-test-session" });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to end session.";
        toastError(msg, { id: "faq-rag-test-session" });
      } finally {
        resetConversation();
      }
    },
    [baseUrl, resetConversation, session?.id],
  );

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

      const userMsg: RagTestMessage = { id: newMessageId(), role: "user", content: q };
      setMessages((prev) => [...prev, userMsg]);
      setRunning(true);
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

        const body: Record<string, unknown> = {
          taskType: "rag",
          model: ragModel,
          input: [{ role: "user", content: q }],
          maxTokens: 500,
        };
        if (session?.id) {
          body.sessionId = session.id;
        } else {
          body.generateSessionId = true;
        }

        const res = await fetch(`${baseUrl}/api/v1/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": key,
          },
          body: JSON.stringify(body),
        });

        const create = (await res.json().catch(() => null)) as CreateJobResponse | null;
        const jobId = parseCreateJobId(create);
        if (!res.ok || !jobId) {
          throw new Error(formatChatJobCreateError(create));
        }

        const returnedSession = parseCreateJobSession(create);
        if (returnedSession) {
          setSession(returnedSession);
        }

        const text = await waitForRagJobAnswer(baseUrl, jobId, { kind: "apiKey", apiKey: key });
        const job = await fetchPublicJobForAuth(baseUrl, jobId, { kind: "apiKey", apiKey: key });
        const jobStatus = job?.status?.trim() || "completed";

        setLastJob({ id: jobId, status: jobStatus });
        setMessages((prev) => [
          ...prev,
          { id: newMessageId(), role: "assistant", content: text.trim() ? text : "(empty answer)" },
        ]);

        return {
          ok: true,
          answer: text,
          jobId,
          jobStatus,
          session: returnedSession ?? session,
        };
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Request failed.";
        setError(msg);
        setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
        toastError(msg, { id: "faq-rag-test" });
        return { ok: false, message: msg };
      } finally {
        setRunning(false);
      }
    },
    [baseUrl, session],
  );

  return {
    baseUrl,
    running,
    error,
    messages,
    session,
    lastJob,
    run,
    startSession,
    endSession,
    resetConversation,
  };
}
