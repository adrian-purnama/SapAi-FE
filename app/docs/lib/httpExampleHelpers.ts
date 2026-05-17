/**
 * URL + defaults for API docs snippets.
 * Add a page: register href in docsNav.ts, add route page.tsx, compose ApiHttpExamplesPanel with a spec.
 */

import type { SnippetRequest } from "./snippets/generators";

export type SnippetTarget = "standalone" | "nextApp";

export const DEFAULT_STANDALONE_BASE = "http://localhost:8000";
export const DEFAULT_NEXT_APP_BASE = "http://localhost:3000";

export function joinDocsUrl(base: string, path: string, target: SnippetTarget = "standalone"): string {
  const fallback = target === "nextApp" ? DEFAULT_NEXT_APP_BASE : DEFAULT_STANDALONE_BASE;
  const b = ((base || "").trim() || fallback).replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

function defaultBaseForTarget(target: SnippetTarget): string {
  return target === "standalone" ? DEFAULT_STANDALONE_BASE : DEFAULT_NEXT_APP_BASE;
}

export function resolveSnippetRequest(params: {
  target: SnippetTarget;
  standaloneBase: string;
  nextAppBase: string;
  method: string;
  path: string;
  apiKeyValue?: string;
  includeApiKeyHeader?: boolean;
  extraHeaders?: Record<string, string>;
  body?: unknown;
}): SnippetRequest {
  const rawBase =
    params.target === "standalone" ? params.standaloneBase : params.nextAppBase;
  const base = (rawBase || "").trim() || defaultBaseForTarget(params.target);
  const url = joinDocsUrl(base, params.path, params.target);

  const headers: Record<string, string> = { ...(params.extraHeaders ?? {}) };
  if (params.includeApiKeyHeader) {
    headers["x-api-key"] = params.apiKeyValue?.trim() || "YOUR_API_KEY";
  }

  const upper = params.method.toUpperCase();
  const hasBody =
    params.body !== undefined &&
    params.body !== null &&
    upper !== "GET" &&
    upper !== "HEAD";

  if (hasBody && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  return {
    method: upper,
    url,
    headers,
    body: hasBody ? params.body : undefined,
  };
}
