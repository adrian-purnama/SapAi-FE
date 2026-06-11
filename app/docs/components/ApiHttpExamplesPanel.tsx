"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { highlightRunResponse, highlightSnippetTab, type SnippetTabId } from "@/app/docs/lib/docsSnippetHighlight";
import {
  DEFAULT_NEXT_APP_BASE,
  resolveSnippetRequest,
  type SnippetTarget,
} from "@/app/docs/lib/httpExampleHelpers";
import { SNIPPET_LANGUAGES } from "@/app/docs/lib/snippets/generators";

import {
  ALLOWED_CHAT_MODEL_IDS,
  MESSAGE_ROLES,
  TASK_TYPES,
  type MessageRole,
  type TaskType,
} from "@/app/docs/constants/standaloneApiDocs";
import { SearchableSelect } from "@/app/components/SearchableSelect";
import { useApiDocsSettings } from "./ApiDocsSettingsProvider";

const fieldClass =
  "mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono text-xs text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400";

const btnSecondaryClass =
  "inline-flex items-center rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 shadow-sm hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-400";

function newRowId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `row_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export type ApiHttpExamplesSimpleProps = {
  variant: "simple";
  target: SnippetTarget;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /**
   * Full URL path. When `jobIdPathPrefix` is set, this is ignored for requests and only used as a
   * fallback label; snippets use `${jobIdPathPrefix}/${jobId}` from the field below.
   */
  path: string;
  apiKey?: boolean;
  extraHeaders?: Record<string, string>;
  body?: Record<string, unknown>;
  /** Show a “Job id” input; resolved path = `${jobIdPathPrefix}/${trim(jobId)}` (API key still from settings). */
  jobIdPathPrefix?: string;
  defaultJobId?: string;
};

export type ApiHttpExamplesChatJobProps = {
  variant: "chatJob";
  target?: SnippetTarget;
};

export type ApiHttpExamplesPanelProps = ApiHttpExamplesSimpleProps | ApiHttpExamplesChatJobProps;

function readEnvNextAppBase(): string {
  return (
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_APP_URL?.trim()) ||
    DEFAULT_NEXT_APP_BASE
  );
}

export function ApiHttpExamplesPanel(props: ApiHttpExamplesPanelProps) {
  const ctx = useApiDocsSettings();
  const [nextAppBase] = useState(() => {
    if (typeof window !== "undefined") return window.location.origin;
    return readEnvNextAppBase();
  });

  if (props.variant === "chatJob") {
    return (
      <ChatJobExamples
        target={props.target ?? "standalone"}
        standaloneBase={ctx.baseUrl}
        nextAppBase={nextAppBase}
      />
    );
  }

  return (
    <SimpleExamples
      target={props.target}
      method={props.method}
      path={props.path}
      apiKey={props.apiKey}
      extraHeaders={props.extraHeaders}
      body={props.body}
      jobIdPathPrefix={props.jobIdPathPrefix}
      defaultJobId={props.defaultJobId}
      standaloneBase={ctx.baseUrl}
      nextAppBase={nextAppBase}
    />
  );
}

function SimpleExamples({
  target,
  method,
  path,
  apiKey,
  extraHeaders,
  body,
  jobIdPathPrefix,
  defaultJobId,
  standaloneBase,
  nextAppBase,
}: {
  target: SnippetTarget;
  method: ApiHttpExamplesSimpleProps["method"];
  path: string;
  apiKey?: boolean;
  extraHeaders?: Record<string, string>;
  body?: Record<string, unknown>;
  jobIdPathPrefix?: string;
  defaultJobId?: string;
  standaloneBase: string;
  nextAppBase: string;
}) {
  const ctx = useApiDocsSettings();
  const fallbackJobId = defaultJobId?.trim() || "507f1f77bcf86cd799439011";
  const [jobId, setJobId] = useState(fallbackJobId);

  const resolvedPath = useMemo(() => {
    if (!jobIdPathPrefix?.trim()) return path;
    const prefix = jobIdPathPrefix.replace(/\/$/, "");
    const id = jobId.trim() || fallbackJobId;
    return `${prefix}/${id}`;
  }, [jobIdPathPrefix, path, jobId, fallbackJobId]);

  const req = useMemo(
    () =>
      resolveSnippetRequest({
        target,
        standaloneBase,
        nextAppBase,
        method,
        path: resolvedPath,
        includeApiKeyHeader: apiKey,
        apiKeyValue: ctx.apiKey,
        extraHeaders,
        body,
      }),
    [
      target,
      standaloneBase,
      nextAppBase,
      method,
      resolvedPath,
      apiKey,
      ctx.apiKey,
      extraHeaders,
      body,
    ],
  );

  return (
    <div className="mt-4 space-y-4">
      {jobIdPathPrefix ? (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Path</p>
          <p className="mt-1 text-sm text-zinc-600">
            Set <strong className="font-medium text-zinc-800">Job id</strong> from{" "}
            <code className="font-mono text-xs">POST /api/v1/chat</code> (
            <code className="font-mono text-xs">job.id</code>).{" "}
            <strong className="font-medium text-zinc-800">API key</strong> stays in Standalone API
            settings at the top.
          </p>
          <label className="mt-4 block text-sm">
            <span className="font-medium text-zinc-700">Job id</span>
            <input
              type="text"
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              spellCheck={false}
              autoComplete="off"
              placeholder={fallbackJobId}
              className={fieldClass}
            />
          </label>
          <p className="mt-2 font-mono text-xs text-zinc-500">
            → <span className="text-zinc-700">{resolvedPath}</span>
          </p>
        </div>
      ) : null}

      <SnippetBlocks
        req={req}
        baseHint={target === "standalone" ? "standalone" : "next"}
        runCredentials={target === "nextApp" ? "include" : "omit"}
        requiresApiKey={!!apiKey}
        apiKeyPresent={ctx.apiKey.trim().length > 0}
      />
    </div>
  );
}

type TemplateBuilderRow = { id: string; propertyKey: string; placeholder: string };

function ChatJobExamples({
  target,
  standaloneBase,
  nextAppBase,
}: {
  target: SnippetTarget;
  standaloneBase: string;
  nextAppBase: string;
}) {
  const ctx = useApiDocsSettings();
  const [taskType, setTaskType] = useState<TaskType>("chat");
  const [model, setModel] = useState<string>(ALLOWED_CHAT_MODEL_IDS[0]);
  const [role, setRole] = useState<MessageRole>("user");
  const [content, setContent] = useState("Hello");
  const [sourceLang, setSourceLang] = useState("English");
  const [sourceCode, setSourceCode] = useState("en");
  const [targetLang, setTargetLang] = useState("Indonesian");
  const [targetCode, setTargetCode] = useState("id");
  const [translateText, setTranslateText] = useState("Hello, how are you?");
  const [maxTokens, setMaxTokens] = useState("500");
  const [outputJsonTemplate, setOutputJsonTemplate] = useState("");
  const [taskTypeOptions, setTaskTypeOptions] = useState<string[]>(() => [...TASK_TYPES]);
  const [modelOptions, setModelOptions] = useState<string[]>(() => [...ALLOWED_CHAT_MODEL_IDS]);
  const [builderRows, setBuilderRows] = useState<TemplateBuilderRow[]>(() => [
    { id: newRowId(), propertyKey: "color", placeholder: "$color" },
    { id: newRowId(), propertyKey: "uniqueName", placeholder: "$uniqueName" },
  ]);

  const isTranslate = taskType === "translate";

  const body = useMemo(() => {
    const n = Number.parseInt(maxTokens, 10);
    const max = Number.isFinite(n) && n > 0 ? n : 500;

    if (isTranslate) {
      return {
        taskType: "translate",
        sourceLang: sourceLang.trim() || "English",
        sourceCode: sourceCode.trim() || "en",
        targetLang: targetLang.trim() || "Indonesian",
        targetCode: targetCode.trim() || "id",
        text: translateText.trim() || "Hello, how are you?",
        maxTokens: max,
      };
    }

    const text = content.trim() || "Hello";
    const base: Record<string, unknown> = {
      taskType,
      model,
      input: [{ role, content: text }],
      maxTokens: max,
    };
    const t = outputJsonTemplate.trim();
    if (t.length > 0) {
      base.outputJsonTemplate = t;
    }
    return base;
  }, [
    taskType,
    isTranslate,
    model,
    role,
    content,
    sourceLang,
    sourceCode,
    targetLang,
    targetCode,
    translateText,
    maxTokens,
    outputJsonTemplate,
  ]);

  const req = useMemo(
    () =>
      resolveSnippetRequest({
        target,
        standaloneBase,
        nextAppBase,
        method: "POST",
        path: "/api/v1/chat",
        includeApiKeyHeader: true,
        apiKeyValue: ctx.apiKey,
        body,
      }),
    [target, standaloneBase, nextAppBase, ctx.apiKey, body],
  );

  useEffect(() => {
    const base = standaloneBase.replace(/\/$/, "");
    const key = ctx.apiKey.trim();
    if (!key) return;
    void (async () => {
      try {
        const res = await fetch(`${base}/api/v1/chat/task-types`, {
          method: "GET",
          headers: { "x-api-key": key },
        });
        const json = (await res.json().catch(() => null)) as unknown;
        if (!res.ok || !Array.isArray(json)) return;
        const list = json.filter((x) => typeof x === "string") as string[];
        if (list.length > 0) setTaskTypeOptions(list);
      } catch {
        // ignore
      }
    })();
  }, [standaloneBase, ctx.apiKey]);

  useEffect(() => {
    const base = standaloneBase.replace(/\/$/, "");
    const key = ctx.apiKey.trim();
    if (!key) return;
    void (async () => {
      try {
        const res = await fetch(`${base}/api/v1/chat/models`, {
          method: "GET",
          headers: { "x-api-key": key },
        });
        const json = (await res.json().catch(() => null)) as unknown;
        if (!res.ok || !Array.isArray(json)) return;
        const list = json.filter((x) => typeof x === "string") as string[];
        if (list.length > 0) {
          setModelOptions(list);
          if (!list.includes(model)) setModel(list[0]!);
        }
      } catch {
        // ignore
      }
    })();
    // model is intentionally included so we can keep the selected value valid.
  }, [standaloneBase, ctx.apiKey, model]);

  const applyGeneratedTemplate = () => {
    const obj: Record<string, string> = {};
    for (const row of builderRows) {
      const k = row.propertyKey.trim();
      if (!k) continue;
      let p = row.placeholder.trim();
      if (!p) {
        p = `$${k}`;
      } else if (!p.startsWith("$")) {
        p = `$${p}`;
      }
      obj[k] = p;
    }
    if (Object.keys(obj).length === 0) return;
    setOutputJsonTemplate(JSON.stringify([obj]));
  };

  return (
    <div className="mt-6 space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Request body</p>
        <p className="mt-1 text-sm text-zinc-600">
          One message becomes <code className="font-mono text-xs">input[0]</code>. Optional{" "}
          <code className="font-mono text-xs">outputJsonTemplate</code> adds structured JSON instructions (see
          below). Set <strong className="font-medium text-zinc-800">API key</strong> only in{" "}
          <strong className="font-medium text-zinc-800">Standalone API settings</strong> at the top of the
          page.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <SearchableSelect
            ui="square"
            label="taskType"
            value={taskType}
            onChange={(v) => setTaskType(v as TaskType)}
            options={taskTypeOptions.map((t) => ({ value: t, label: t }))}
          />

          {!isTranslate ? (
            <SearchableSelect
              ui="square"
              label="model"
              value={model}
              onChange={(v) => setModel(v)}
              options={modelOptions.map((m) => ({ value: m, label: m }))}
            />
          ) : null}

          {!isTranslate ? (
            <label className="block text-sm">
              <span className="font-medium text-zinc-700">input[0].role</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as MessageRole)}
                className={fieldClass}
              >
                {MESSAGE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="block text-sm">
            <span className="font-medium text-zinc-700">maxTokens</span>
            <input
              type="number"
              min={1}
              max={100_000}
              value={maxTokens}
              onChange={(e) => setMaxTokens(e.target.value)}
              className={fieldClass}
            />
          </label>
        </div>

        {isTranslate ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium text-zinc-700">sourceLang</span>
              <input
                type="text"
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className={fieldClass}
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-zinc-700">sourceCode</span>
              <input
                type="text"
                value={sourceCode}
                onChange={(e) => setSourceCode(e.target.value)}
                className={fieldClass}
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-zinc-700">targetLang</span>
              <input
                type="text"
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className={fieldClass}
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-zinc-700">targetCode</span>
              <input
                type="text"
                value={targetCode}
                onChange={(e) => setTargetCode(e.target.value)}
                className={fieldClass}
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="font-medium text-zinc-700">text</span>
              <textarea
                value={translateText}
                onChange={(e) => setTranslateText(e.target.value)}
                rows={4}
                spellCheck={false}
                className={fieldClass}
              />
            </label>
          </div>
        ) : (
          <label className="mt-4 block text-sm">
            <span className="font-medium text-zinc-700">input[0].content</span>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              spellCheck={false}
              className={fieldClass}
            />
          </label>
        )}

        {!isTranslate ? (
        <div className="mt-6 border-t border-zinc-200 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Output JSON template (optional)
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            Sent as <code className="font-mono text-xs">outputJsonTemplate</code>. The server prepends a{" "}
            <code className="font-mono text-xs">system</code> message so the model replies with JSON
            matching this shape (stored merged into <code className="font-mono text-xs">input</code> on the job).
          </p>

          <label className="mt-3 block text-sm">
            <span className="font-medium text-zinc-700">outputJsonTemplate (raw JSON string)</span>
            <textarea
              value={outputJsonTemplate}
              onChange={(e) => setOutputJsonTemplate(e.target.value)}
              rows={3}
              spellCheck={false}
              placeholder='[{"color":"$color","uniqueName":"$uniqueName"}]'
              className={fieldClass}
            />
          </label>

          <div className="mt-4 rounded-lg border border-dashed border-zinc-300 bg-white p-3">
            <p className="text-xs font-semibold text-zinc-600">Template builder</p>
            <p className="mt-1 text-xs text-zinc-500">
              One JSON array with one object: property keys and placeholder tokens (e.g.{" "}
              <code className="font-mono">$color</code>). Generates into the field above.
            </p>
            <div className="mt-3 space-y-2">
              {builderRows.map((br) => (
                <div key={br.id} className="flex flex-wrap items-end gap-2">
                  <label className="block min-w-40 flex-1 text-sm">
                    <span className="font-medium text-zinc-700">property key</span>
                    <input
                      type="text"
                      value={br.propertyKey}
                      onChange={(e) => {
                        const propertyKey = e.target.value;
                        setBuilderRows((rows) =>
                          rows.map((r) => (r.id === br.id ? { ...r, propertyKey } : r)),
                        );
                      }}
                      spellCheck={false}
                      className={fieldClass}
                    />
                  </label>
                  <label className="block min-w-40 flex-1 text-sm">
                    <span className="font-medium text-zinc-700">placeholder</span>
                    <input
                      type="text"
                      value={br.placeholder}
                      onChange={(e) => {
                        const placeholder = e.target.value;
                        setBuilderRows((rows) =>
                          rows.map((r) => (r.id === br.id ? { ...r, placeholder } : r)),
                        );
                      }}
                      spellCheck={false}
                      placeholder="$color"
                      className={fieldClass}
                    />
                  </label>
                  <button
                    type="button"
                    className={`${btnSecondaryClass} mb-0.5`}
                    disabled={builderRows.length <= 1}
                    onClick={() =>
                      setBuilderRows((rows) =>
                        rows.length <= 1 ? rows : rows.filter((r) => r.id !== br.id),
                      )
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className={btnSecondaryClass}
                onClick={() =>
                  setBuilderRows((rows) => [
                    ...rows,
                    { id: newRowId(), propertyKey: "", placeholder: "" },
                  ])
                }
              >
                Add property
              </button>
              <button type="button" className={btnSecondaryClass} onClick={applyGeneratedTemplate}>
                Generate JSON template
              </button>
            </div>
          </div>
        </div>
        ) : null}
      </div>

      <SnippetBlocks
        req={req}
        baseHint={target === "standalone" ? "standalone" : "next"}
        runCredentials={target === "nextApp" ? "include" : "omit"}
        requiresApiKey
        apiKeyPresent={ctx.apiKey.trim().length > 0}
      />
    </div>
  );
}

const SNIPPET_TAB_LABELS: Record<SnippetTabId, string> = {
  curl: "curl",
  javascript: "JavaScript",
  python: "Python",
};

function SnippetBlocks({
  req,
  baseHint,
  runCredentials,
  requiresApiKey,
  apiKeyPresent,
}: {
  req: ReturnType<typeof resolveSnippetRequest>;
  baseHint: "standalone" | "next";
  runCredentials: RequestCredentials;
  requiresApiKey: boolean;
  apiKeyPresent: boolean;
}) {
  const [activeLang, setActiveLang] = useState<SnippetTabId>("curl");
  const [snippetHtml, setSnippetHtml] = useState("");
  const [snippetLoading, setSnippetLoading] = useState(true);

  const [runLoading, setRunLoading] = useState(false);
  const [runOutputHtml, setRunOutputHtml] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);

  const activeBuild = useMemo(
    () => SNIPPET_LANGUAGES.find((l) => l.id === activeLang)?.build ?? SNIPPET_LANGUAGES[0].build,
    [activeLang],
  );

  const sourceCode = useMemo(() => activeBuild(req).trim(), [activeBuild, req]);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSnippetLoading(true);
    highlightSnippetTab(sourceCode, activeLang)
      .then((html) => {
        if (!cancelled) {
          setSnippetHtml(html);
          setSnippetLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSnippetHtml("");
          setSnippetLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [sourceCode, activeLang]);

  const runDisabled = runLoading || (requiresApiKey && !apiKeyPresent);

  const handleRun = useCallback(async () => {
    if (runLoading) return;
    if (requiresApiKey && !apiKeyPresent) return;

    setRunLoading(true);
    setRunError(null);
    setRunOutputHtml(null);

    try {
      const init: RequestInit = {
        method: req.method,
        headers: { ...req.headers },
        credentials: runCredentials,
      };
      const upper = req.method.toUpperCase();
      if (
        req.body !== undefined &&
        req.body !== null &&
        upper !== "GET" &&
        upper !== "HEAD"
      ) {
        init.body = JSON.stringify(req.body);
      }

      const res = await fetch(req.url, init);
      const text = await res.text();
      const banner = `${res.status} ${res.statusText}`;
      const combined = res.ok ? text : `${banner}\n\n${text}`;
      const html = await highlightRunResponse(combined);
      setRunOutputHtml(html);
      if (!res.ok) setRunError(banner);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setRunError(msg);
      setRunOutputHtml(await highlightRunResponse(msg));
    } finally {
      setRunLoading(false);
    }
  }, [req, runCredentials, requiresApiKey, apiKeyPresent, runLoading]);

  return (
    <div className="space-y-4">
      {requiresApiKey && !apiKeyPresent ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
          Add an API key under <strong className="font-medium">Standalone API settings</strong> above
          to enable Run and to substitute a real key in the snippets.
        </p>
      ) : null}

      <div className="rounded-xl border border-sky-200/80 bg-sky-50/40 p-4 shadow-sm">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-900">Live request</p>
        <p className="mt-1 break-all font-mono text-xs text-zinc-800">
          <span className="font-semibold text-sky-900">{req.method}</span> {req.url}
        </p>
        <p className="mt-2 text-[11px] text-zinc-600">
          {baseHint === "standalone"
            ? "Uses Standalone API settings (CORS must allow this site)."
            : "Uses this app origin; cookies included when relevant."}
        </p>
        <button
          type="button"
          className="mt-3 inline-flex items-center justify-center rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={runDisabled}
          onClick={() => void handleRun()}
        >
          {runLoading ? "Running…" : "Run request"}
        </button>
        {runOutputHtml ? (
          <div className="mt-4 overflow-hidden rounded-lg border border-zinc-700 bg-[#282a36] shadow-md">
            <div className="border-b border-zinc-700 bg-[#21222c] px-3 py-1.5 text-xs font-medium text-[#f8f8f2]">
              Live response
              {runError ? (
                <span className="ml-2 font-normal text-[#ffb86c]">({runError})</span>
              ) : null}
            </div>
            <div
              className="overflow-x-auto p-4 text-xs [&_.shiki]:bg-transparent [&_pre]:m-0 [&_pre]:bg-transparent [&_pre]:p-0 [&_pre]:font-mono"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: runOutputHtml }}
            />
          </div>
        ) : (
          <p className="mt-3 text-[11px] text-zinc-500">
            No response yet — click <strong className="font-medium text-zinc-700">Run request</strong>.
          </p>
        )}
      </div>

      <details className="group overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <summary className="cursor-pointer select-none px-3 py-2.5 text-sm font-medium text-zinc-800 marker:text-zinc-400 hover:bg-zinc-50">
          Code samples (curl, JavaScript, Python)
        </summary>
        <div className="border-t border-zinc-200">
          <div className="overflow-hidden border-b border-zinc-700 bg-[#21222c]">
            <div className="flex flex-wrap gap-1 px-2 py-2" role="tablist" aria-label="Request example language">
            {SNIPPET_LANGUAGES.map(({ id, title }) => {
              const selected = activeLang === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  id={`snippet-tab-${id}`}
                  className={[
                    "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    selected
                      ? "bg-[#bd93f9] text-[#282a36]"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
                  ].join(" ")}
                  onClick={() => setActiveLang(id as SnippetTabId)}
                >
                  {SNIPPET_TAB_LABELS[id as SnippetTabId]}
                  <span className="sr-only"> — {title}</span>
                </button>
              );
            })}
            </div>
          </div>
          <div className="relative min-h-[100px] bg-[#282a36]">
          {snippetLoading ? (
            <p className="p-4 text-xs text-zinc-500">Syntax highlighting…</p>
          ) : (
            <div
              className="docs-snippet-shiki overflow-x-auto p-4 text-xs leading-relaxed [&_.shiki]:bg-transparent [&_pre]:m-0 [&_pre]:bg-transparent [&_pre]:p-0 [&_pre]:font-mono"
              // eslint-disable-next-line react/no-danger -- trusted Shiki HTML output
              dangerouslySetInnerHTML={{ __html: snippetHtml }}
            />
          )}
          </div>
        </div>
      </details>
    </div>
  );
}
