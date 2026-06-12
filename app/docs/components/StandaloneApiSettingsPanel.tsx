"use client";

import { useState } from "react";
import { ChevronDown, KeyRound, Server } from "lucide-react";

import { useApiDocsSettings } from "./ApiDocsSettingsProvider";

function hostFromUrl(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url.replace(/^https?:\/\//, "").split("/")[0] ?? url;
  }
}

export function StandaloneApiSettingsPanel() {
  const { baseUrl, setBaseUrl, apiKey, setApiKey, hydrated, defaultBaseUrl } = useApiDocsSettings();
  const [expanded, setExpanded] = useState(false);

  if (!hydrated) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-500">
        Loading API settings…
      </div>
    );
  }

  const keySet = apiKey.trim().length > 0;
  const host = hostFromUrl(baseUrl.trim() || defaultBaseUrl);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-800">
            <Server className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
            API settings
          </span>
          <span className="text-xs text-zinc-500">{host}</span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
              keySet ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
            }`}
          >
            <KeyRound className="h-3 w-3" aria-hidden />
            {keySet ? "Key set" : "No key"}
          </span>
        </div>
        <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-zinc-600">
          {expanded ? "Hide" : "Configure"}
          <ChevronDown
            className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
            aria-hidden
          />
        </span>
      </button>

      {expanded ? (
        <div className="border-t border-zinc-200 px-4 pb-4 pt-3">
          <p className="text-xs text-zinc-600">
            Base URL and API key are stored locally and used for Run request and code samples.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium text-zinc-700">Base URL</span>
              <input
                type="url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder={defaultBaseUrl}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono text-xs text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-zinc-700">API key</span>
              <input
                type="password"
                autoComplete="off"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="x-api-key header"
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono text-xs text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </label>
          </div>
        </div>
      ) : null}
    </div>
  );
}
