"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BarChart3, Loader2, Lock, Plug } from "lucide-react";

import { toastError, toastSuccess } from "@/lib/app-toast";
import { joinServerApiPath } from "@/lib/server-api";

type McpSettings = {
  enabled: boolean;
  mcpUrl: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
  mcpPlanEligible: boolean;
};

type ProjectMcpPanelProps = {
  apiKeyId: string;
  token: string | null;
  disabled?: boolean;
};

const EMPTY_SETTINGS: McpSettings = {
  enabled: false,
  mcpUrl: "",
  headers: {},
  body: {},
  mcpPlanEligible: false,
};

function parseMcpSettings(raw: unknown): McpSettings {
  if (!raw || typeof raw !== "object") return { ...EMPTY_SETTINGS };
  const o = raw as Record<string, unknown>;
  const headers =
    o.headers && typeof o.headers === "object" && !Array.isArray(o.headers)
      ? (o.headers as Record<string, string>)
      : {};
  const body =
    o.body && typeof o.body === "object" && !Array.isArray(o.body)
      ? (o.body as Record<string, unknown>)
      : {};
  return {
    enabled: Boolean(o.enabled),
    mcpUrl: typeof o.mcpUrl === "string" ? o.mcpUrl : "",
    headers,
    body,
    mcpPlanEligible: typeof o.mcpPlanEligible === "boolean" ? o.mcpPlanEligible : false,
  };
}

function formatJson(value: unknown): string {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return "{}";
  }
}

function parseJsonObject(raw: string, label: string): Record<string, unknown> {
  const trimmed = raw.trim();
  if (!trimmed) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error(`${label} must be valid JSON.`);
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${label} must be a JSON object.`);
  }
  return parsed as Record<string, unknown>;
}

export function ProjectMcpPanel({ apiKeyId, token, disabled }: ProjectMcpPanelProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<McpSettings>(EMPTY_SETTINGS);
  const [mcpUrl, setMcpUrl] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [headersText, setHeadersText] = useState("{}");
  const [bodyText, setBodyText] = useState("{}");

  const applyToForm = useCallback((s: McpSettings) => {
    setSettings(s);
    setMcpUrl(s.mcpUrl);
    setEnabled(s.enabled);
    setHeadersText(formatJson(s.headers));
    setBodyText(formatJson(s.body));
  }, []);

  const load = useCallback(async () => {
    if (!token || !apiKeyId) return;
    setLoading(true);
    try {
      const res = await fetch(joinServerApiPath(`/api/v1/api-keys/${encodeURIComponent(apiKeyId)}/mcp`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await res.json();
      if (!res.ok || !payload?.success) {
        throw new Error(payload?.error?.message ?? "Failed to load MCP settings.");
      }
      applyToForm(parseMcpSettings(payload.data));
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to load MCP settings.", { id: "project-mcp-load" });
      applyToForm(EMPTY_SETTINGS);
    } finally {
      setLoading(false);
    }
  }, [apiKeyId, token, applyToForm]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSave() {
    if (!token || disabled) return;
    setSaving(true);
    try {
      const headersObj = parseJsonObject(headersText, "Headers");
      for (const [k, v] of Object.entries(headersObj)) {
        if (typeof v !== "string") {
          throw new Error(`Header "${k}" must be a string value.`);
        }
      }
      const bodyObj = parseJsonObject(bodyText, "Body");

      const res = await fetch(joinServerApiPath(`/api/v1/api-keys/${encodeURIComponent(apiKeyId)}/mcp`), {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enabled,
          mcpUrl: mcpUrl.trim(),
          headers: headersObj as Record<string, string>,
          body: bodyObj,
        }),
      });
      const payload = await res.json();
      if (!res.ok || !payload?.success) {
        throw new Error(payload?.error?.message ?? "Failed to save MCP settings.");
      }
      applyToForm(parseMcpSettings(payload.data));
      const toolTest = payload.data?.toolTest as { ok?: boolean; tools?: string[]; error?: string } | undefined;
      if (toolTest?.ok && toolTest.tools?.length) {
        toastSuccess(`MCP tools available: ${toolTest.tools.join(", ")}`, { id: "project-mcp-tools" });
      } else if (toolTest && toolTest.ok === false && toolTest.error) {
        toastError(`MCP probe failed: ${toolTest.error}`, { id: "project-mcp-tools" });
      } else {
        toastSuccess("MCP settings saved.", { id: "project-mcp-save" });
      }
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to save MCP settings.", { id: "project-mcp-save" });
    } finally {
      setSaving(false);
    }
  }

  if (!loading && !settings.mcpPlanEligible) {
    return (
      <section
        className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm"
        aria-labelledby="project-mcp-upsell-heading"
      >
        <div className="absolute left-0 top-0 h-full w-1 bg-zinc-900" aria-hidden />
        <div className="pl-5 pr-4 py-5 sm:pl-6 sm:pr-5 sm:py-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-3">
                <span
                  className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md border-2 border-zinc-900 bg-zinc-950 text-white shadow-sm"
                  aria-hidden
                >
                  <Lock className="h-[18px] w-[18px]" strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <h2 id="project-mcp-upsell-heading" className="text-lg font-semibold tracking-tight text-zinc-950">
                    MCP client
                  </h2>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Plan upgrade</p>
                </div>
              </div>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-600">
                Connect this project to an external MCP server so SapAi can use its tools and resources.
              </p>
            </div>
            <div className="flex w-full shrink-0 flex-col gap-3 lg:w-[min(100%,240px)] lg:pt-1">
              <Link
                href="/pricing"
                className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-zinc-950 px-5 py-3.5 text-center text-sm font-semibold text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_10px_28px_-12px_rgba(0,0,0,0.55)] ring-1 ring-zinc-950 transition hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950 active:scale-[0.99]"
              >
                <span className="relative z-10">View plans and upgrade</span>
                <BarChart3 className="relative z-10 h-4 w-4 opacity-90" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section
        className="rounded-xl border border-zinc-200/90 bg-white p-5 shadow-sm sm:p-6"
        aria-busy="true"
        aria-label="Loading MCP settings"
      >
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-zinc-600">
          <Loader2 className="h-5 w-5 animate-spin text-zinc-500" aria-hidden />
          Loading MCP settings…
        </div>
      </section>
    );
  }

  const blocked = disabled || saving;

  return (
    <section className="rounded-xl border border-zinc-200/90 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="project-mcp-heading">
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 text-zinc-800"
          aria-hidden
        >
          <Plug className="h-5 w-5" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="project-mcp-heading" className="text-lg font-semibold text-zinc-900">
            MCP client
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            SapAi connects to your external MCP server using the URL, headers, and body below (auth in header or body as
            needed).
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4 border-t border-zinc-200/80 pt-5">
        <label className="flex cursor-pointer select-none items-center gap-2.5 text-sm text-zinc-800">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400"
            checked={enabled}
            disabled={blocked}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          <span>
            <span className="font-medium">MCP active</span>
            <span className="mt-0.5 block text-xs font-normal text-zinc-500">
              When on, this project may use the configured MCP server.
            </span>
          </span>
        </label>

        <div>
          <label htmlFor="project-mcp-url" className="text-xs font-medium text-zinc-800">
            MCP server URL
          </label>
          <input
            id="project-mcp-url"
            type="url"
            placeholder="https://mcp.example.com/v1"
            className="mt-1 w-full rounded-lg border border-zinc-200/90 bg-zinc-50/40 px-2.5 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-200/80 disabled:opacity-50"
            value={mcpUrl}
            disabled={blocked}
            onChange={(e) => setMcpUrl(e.target.value)}
          />
          <p className="mt-1 text-xs text-zinc-500">HTTPS required; http://localhost allowed for local dev.</p>
        </div>

        <div>
          <label htmlFor="project-mcp-headers" className="text-xs font-medium text-zinc-800">
            Headers (JSON)
          </label>
          <textarea
            id="project-mcp-headers"
            rows={4}
            spellCheck={false}
            className="mt-1 w-full rounded-lg border border-zinc-200/90 bg-zinc-50/40 px-2.5 py-2 font-mono text-xs text-zinc-900 focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-200/80 disabled:opacity-50"
            value={headersText}
            disabled={blocked}
            onChange={(e) => setHeadersText(e.target.value)}
          />
          <p className="mt-1 text-xs text-zinc-500">String values only, e.g. Authorization bearer tokens.</p>
        </div>

        <div>
          <label htmlFor="project-mcp-body" className="text-xs font-medium text-zinc-800">
            Body (JSON)
          </label>
          <textarea
            id="project-mcp-body"
            rows={4}
            spellCheck={false}
            className="mt-1 w-full rounded-lg border border-zinc-200/90 bg-zinc-50/40 px-2.5 py-2 font-mono text-xs text-zinc-900 focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-200/80 disabled:opacity-50"
            value={bodyText}
            disabled={blocked}
            onChange={(e) => setBodyText(e.target.value)}
          />
          <p className="mt-1 text-xs text-zinc-500">Optional JSON merged into MCP requests (e.g. API keys in body).</p>
        </div>

        <button
          type="button"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={blocked}
          onClick={() => void onSave()}
        >
          {saving ? "Saving…" : "Save MCP settings"}
        </button>
      </div>
    </section>
  );
}
