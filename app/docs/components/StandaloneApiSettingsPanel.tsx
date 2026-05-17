"use client";

import { useApiDocsSettings } from "./ApiDocsSettingsProvider";

export function StandaloneApiSettingsPanel() {
  const { baseUrl, setBaseUrl, apiKey, setApiKey, hydrated, defaultBaseUrl } = useApiDocsSettings();

  if (!hydrated) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-500">
        Loading API settings…
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Standalone API settings
      </p>
      <p className="mt-1 text-xs text-zinc-600">
        <strong className="font-medium text-zinc-800">API key is only set here</strong> — not
        repeated on each endpoint. It fills <code className="font-mono text-[10px]">x-api-key</code> in
        snippets and <strong className="font-medium text-zinc-800">Run request</strong> for the
        standalone server. Base URL and key stay in{" "}
        <code className="rounded bg-zinc-200 px-1 py-0.5 font-mono text-[10px]">localStorage</code>{" "}
        (never sent to Next.js API routes).
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
  );
}
