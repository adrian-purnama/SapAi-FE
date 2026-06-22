"use client";

import { useState } from "react";
import { Check, Copy, Sparkles } from "lucide-react";

type Props = {
  prompt: string;
  label?: string;
  className?: string;
};

export function DocsAiPromptCopy({
  prompt,
  label = "Copy AI prompt",
  className = "",
}: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      className={`rounded-xl border border-violet-200/80 bg-violet-50/40 p-4 sm:p-5 ${className}`.trim()}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-950">
            <Sparkles className="h-4 w-4 shrink-0 text-violet-700" aria-hidden />
            Skip reading   paste into your AI assistant
          </p>
          <p className="mt-1 text-sm leading-relaxed text-violet-950/80">
            Copies a ready-made instruction so ChatGPT, Claude, or Cursor can write the integration for you.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-violet-300 bg-white px-3 py-2 text-sm font-medium text-violet-900 shadow-sm hover:bg-violet-50"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" aria-hidden />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" aria-hidden />
              {label}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
