"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import PasswordInput from "@/app/components/PasswordInput";

import { usePlanMessageLimit } from "./usePlanMessageLimit";
import { useProjectFaqRagTest } from "./useProjectFaqRagTest";

function RagLoadingLabel() {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-zinc-600">
      <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-500" aria-hidden />
      Waiting for chat job…
    </span>
  );
}

export type FaqRagTestFormProps = {
  disabled?: boolean;
};

export function FaqRagTestForm({ disabled = false }: FaqRagTestFormProps) {
  const ragTest = useProjectFaqRagTest();
  const { maxCharacterPerMessage, planName, loading: limitsLoading } = usePlanMessageLimit();
  const [testApiKey, setTestApiKey] = useState("");
  const [testQuestion, setTestQuestion] = useState("");
  const questionLength = testQuestion.length;
  const atLimit = questionLength >= maxCharacterPerMessage;

  return (
    <div className="space-y-3">
      <PasswordInput
        label="Project API key"
        value={testApiKey}
        onChange={(v) => setTestApiKey(v)}
        autoComplete="off"
        placeholder="sapai_sk_…"
      />

      <label className="block text-sm">
        <span className="font-medium text-zinc-700">Question</span>
        <textarea
          value={testQuestion}
          onChange={(e) => setTestQuestion(e.target.value)}
          placeholder="Ask something from your knowledge files…"
          rows={4}
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
          className={
            "mt-1 text-xs tabular-nums " + (atLimit ? "font-medium text-amber-800" : "text-zinc-500")
          }
        >
          {limitsLoading ? (
            "Loading plan limit…"
          ) : (
            <>
              <span>
                {questionLength} / {maxCharacterPerMessage} characters
              </span>
              {planName ? (
                <span className="text-zinc-400"> · {planName} plan</span>
              ) : null}
            </>
          )}
        </p>
      </label>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-zinc-500">
          API Url: <span className="font-mono">{ragTest.baseUrl}</span>
        </p>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
          disabled={disabled || ragTest.running}
          onClick={() => {
            void ragTest.run(testQuestion, testApiKey);
          }}
        >
          {ragTest.running ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          Run question
        </button>
      </div>

      <label className="block text-sm">
        <span className="font-medium text-zinc-700">Answer</span>
        {ragTest.running ? (
          <div className="mt-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-700 shadow-sm">
            <RagLoadingLabel />
            <div className="mt-3 space-y-2">
              <div className="h-3 w-5/6 animate-pulse rounded bg-zinc-200" />
              <div className="h-3 w-11/12 animate-pulse rounded bg-zinc-200" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-zinc-200" />
            </div>
          </div>
        ) : (
          <textarea
            value={ragTest.answer}
            placeholder="Answer will appear here…"
            rows={2}
            className="mt-1 w-full resize-y rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            readOnly
          />
        )}
      </label>
    </div>
  );
}
