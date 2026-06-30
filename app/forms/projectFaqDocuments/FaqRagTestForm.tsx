"use client";

import { useCallback, useState } from "react";
import { Copy, Loader2, MessageSquarePlus, RotateCcw, Send, Square } from "lucide-react";

import PasswordInput from "@/app/components/PasswordInput";
import { toastError, toastSuccess } from "@/lib/app-toast";

import { useUserPlanLimits } from "./useUserPlanLimits";
import { useProjectFaqRagTest } from "./useProjectFaqRagTest";

function RagLoadingBubble() {
  return (
    <div className="flex justify-start" aria-live="polite" aria-busy="true">
      <div className="max-w-[92%] rounded-2xl rounded-bl-md border border-zinc-200 bg-white px-3 py-2.5 text-sm shadow-sm">
        <span className="inline-flex items-center gap-2 text-xs font-medium text-zinc-600">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-500" aria-hidden />
          Waiting for chat job…
        </span>
      </div>
    </div>
  );
}

function formatSessionExpiry(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

export type FaqRagTestFormProps = {
  disabled?: boolean;
};

export function FaqRagTestForm({ disabled = false }: FaqRagTestFormProps) {
  const ragTest = useProjectFaqRagTest();
  const { maxCharacterPerMessage, planName, loading: limitsLoading } = useUserPlanLimits();
  const [testApiKey, setTestApiKey] = useState("");
  const [testQuestion, setTestQuestion] = useState("");
  const questionLength = testQuestion.length;
  const atLimit = questionLength >= maxCharacterPerMessage;

  const copyText = useCallback(async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toastSuccess(`${label} copied.`, { id: "faq-rag-test-copy" });
    } catch {
      toastError("Copy failed.", { id: "faq-rag-test-copy" });
    }
  }, []);

  async function onSend() {
    const q = testQuestion.trim();
    if (!q || ragTest.running) return;
    setTestQuestion("");
    await ragTest.run(q, testApiKey);
  }

  return (
    <div className="space-y-4">
      <PasswordInput
        label="Project API key"
        value={testApiKey}
        onChange={(v) => setTestApiKey(v)}
        autoComplete="off"
        placeholder="sapai_sk_…"
      />

      <div className="rounded-lg border border-zinc-200 bg-zinc-50/80 p-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Chat session</p>
            {ragTest.session ? (
              <div className="mt-1 space-y-0.5 text-xs text-zinc-700">
                <p>
                  <span className="font-medium text-zinc-500">ID </span>
                  <code className="break-all font-mono text-[11px]">{ragTest.session.id}</code>
                </p>
                <p>
                  <span className="font-medium text-zinc-500">Expires </span>
                  {formatSessionExpiry(ragTest.session.expiresAt)}
                </p>
              </div>
            ) : (
              <p className="mt-1 text-xs text-zinc-600">
                No active session — send a question to auto-create one, or start manually.
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {ragTest.session ? (
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
                disabled={disabled || ragTest.running}
                onClick={() => void copyText("Session ID", ragTest.session!.id)}
              >
                <Copy className="h-3.5 w-3.5" aria-hidden />
                Copy ID
              </button>
            ) : null}
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
              disabled={disabled || ragTest.running || !testApiKey.trim()}
              onClick={() => void ragTest.startSession(testApiKey)}
            >
              <MessageSquarePlus className="h-3.5 w-3.5" aria-hidden />
              New session
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
              disabled={disabled || ragTest.running || !ragTest.session}
              onClick={() => void ragTest.endSession(testApiKey)}
            >
              <Square className="h-3.5 w-3.5" aria-hidden />
              End session
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
              disabled={disabled || ragTest.running || ragTest.messages.length === 0}
              onClick={() => ragTest.resetConversation()}
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              Clear UI
            </button>
          </div>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
          Uses <code className="font-mono text-[10px]">POST /api/v1/chat-sessions</code>,{" "}
          <code className="font-mono text-[10px]">POST /api/v1/chat</code> with{" "}
          <code className="font-mono text-[10px]">sessionId</code> /{" "}
          <code className="font-mono text-[10px]">generateSessionId</code>, and job stream polling. Multi-turn
          memory matches the public embed widget. When MCP is enabled, later turns can clarify missing tool args.
        </p>
      </div>

      {ragTest.lastJob ? (
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700">
          <span className="font-semibold text-zinc-500">Last job </span>
          <code className="font-mono text-[11px]">{ragTest.lastJob.id}</code>
          <span className="mx-1 text-zinc-400">·</span>
          <span className="font-medium">{ragTest.lastJob.status}</span>
          <button
            type="button"
            className="ml-2 inline-flex items-center gap-1 font-semibold text-sky-800 hover:underline"
            onClick={() => void copyText("Job ID", ragTest.lastJob!.id)}
          >
            <Copy className="h-3 w-3" aria-hidden />
            Copy
          </button>
        </div>
      ) : null}

      <div
        className="min-h-[10rem] max-h-80 space-y-3 overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-50/50 p-3"
        aria-label="RAG test conversation"
      >
        {ragTest.messages.length === 0 && !ragTest.running ? (
          <p className="py-6 text-center text-sm text-zinc-500">
            Send a question to test FAQ retrieval. Follow-up messages reuse the session.
          </p>
        ) : null}
        {ragTest.messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={
                m.role === "user"
                  ? "max-w-[90%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-zinc-900 px-3 py-2 text-sm text-white"
                  : "max-w-[92%] whitespace-pre-wrap rounded-2xl rounded-bl-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm"
              }
            >
              {m.content}
            </div>
          </div>
        ))}
        {ragTest.running ? <RagLoadingBubble /> : null}
      </div>

      {ragTest.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900" role="alert">
          {ragTest.error}
        </p>
      ) : null}

      <label className="block text-sm">
        <span className="font-medium text-zinc-700">Message</span>
        <textarea
          value={testQuestion}
          onChange={(e) => setTestQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void onSend();
            }
          }}
          placeholder="Ask something from your knowledge files… (Enter to send)"
          rows={3}
          maxLength={maxCharacterPerMessage}
          aria-describedby="rag-test-question-limit"
          className={
            "mt-1 w-full resize-y rounded-lg border px-3 py-2 text-sm text-zinc-900 shadow-sm focus:outline-none focus:ring-1 " +
            (atLimit
              ? "border-amber-300 focus:border-amber-500 focus:ring-amber-200"
              : "border-zinc-300 focus:border-zinc-500 focus:ring-zinc-400")
          }
          disabled={disabled || ragTest.running}
        />
        <p
          id="rag-test-question-limit"
          className={"mt-1 text-xs tabular-nums " + (atLimit ? "font-medium text-amber-800" : "text-zinc-500")}
        >
          {limitsLoading ? (
            "Loading plan limit…"
          ) : (
            <>
              <span>
                {questionLength} / {maxCharacterPerMessage} characters
              </span>
              {planName ? <span className="text-zinc-400"> · {planName} plan</span> : null}
            </>
          )}
        </p>
      </label>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-zinc-500">
          API: <span className="font-mono">{ragTest.baseUrl}</span>
        </p>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
          disabled={disabled || ragTest.running || !testQuestion.trim()}
          onClick={() => void onSend()}
        >
          {ragTest.running ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
          Send
        </button>
      </div>
    </div>
  );
}
