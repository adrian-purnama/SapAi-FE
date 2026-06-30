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
  MESSAGE_ROLES,
  OCR_MODES,
  TASK_TYPES,
  type MessageRole,
  type OcrMode,
  type TaskType,
} from "@/app/docs/constants/standaloneApiDocs";
import { SearchableSelect } from "@/app/components/SearchableSelect";
import { parseCreateJobSession } from "@/lib/waitForRagJobAnswer";
import { useApiDocsSettings } from "./ApiDocsSettingsProvider";

const fieldClass =
  "mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono text-xs text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400";

const btnSecondaryClass =
  "inline-flex items-center rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 shadow-sm hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-400";

function extractJobIdFromResponse(text: string): string | null {
  try {
    const json = JSON.parse(text) as {
      job?: { id?: unknown };
      id?: unknown;
      data?: { job?: { id?: unknown }; id?: unknown };
    };
    const id = json.data?.job?.id ?? json.data?.id ?? json.job?.id ?? json.id;
    return typeof id === "string" && id.trim().length > 0 ? id.trim() : null;
  } catch {
    return null;
  }
}

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
  /** Lock the form to one task type (hides taskType selector). */
  fixedTaskType?: TaskType;
  /** Called when POST /api/v1/chat returns a job.id in the response. */
  onJobIdCaptured?: (jobId: string) => void;
};

export type ApiHttpExamplesJobPollProps = {
  variant: "jobPoll";
  target?: SnippetTarget;
  jobId: string;
  onJobIdChange: (jobId: string) => void;
  defaultJobId?: string;
};

export type ApiHttpExamplesPanelProps =
  | ApiHttpExamplesSimpleProps
  | ApiHttpExamplesChatJobProps
  | ApiHttpExamplesJobPollProps;

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
        fixedTaskType={props.fixedTaskType}
        onJobIdCaptured={props.onJobIdCaptured}
      />
    );
  }

  if (props.variant === "jobPoll") {
    return (
      <JobPollExamples
        target={props.target ?? "standalone"}
        standaloneBase={ctx.baseUrl}
        nextAppBase={nextAppBase}
        jobId={props.jobId}
        onJobIdChange={props.onJobIdChange}
        defaultJobId={props.defaultJobId}
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
    <div className="space-y-4">
      {jobIdPathPrefix ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <label className="block text-sm">
            <span className="font-medium text-zinc-700">
              Job id <span className="font-normal text-zinc-500">from POST /api/v1/chat → job.id</span>
            </span>
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

function JobPollExamples({
  target,
  standaloneBase,
  nextAppBase,
  jobId,
  onJobIdChange,
  defaultJobId,
}: {
  target: SnippetTarget;
  standaloneBase: string;
  nextAppBase: string;
  jobId: string;
  onJobIdChange: (jobId: string) => void;
  defaultJobId?: string;
}) {
  const ctx = useApiDocsSettings();
  const fallbackJobId = defaultJobId?.trim() || "507f1f77bcf86cd799439011";
  const prefix = "/api/v1/chat/jobs";

  const resolvedPath = useMemo(() => {
    const id = jobId.trim() || fallbackJobId;
    return `${prefix}/${id}`;
  }, [jobId, fallbackJobId]);

  const req = useMemo(
    () =>
      resolveSnippetRequest({
        target,
        standaloneBase,
        nextAppBase,
        method: "GET",
        path: resolvedPath,
        includeApiKeyHeader: true,
        apiKeyValue: ctx.apiKey,
      }),
    [target, standaloneBase, nextAppBase, resolvedPath, ctx.apiKey],
  );

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <label className="block text-sm">
          <span className="font-medium text-zinc-700">
            Job id <span className="font-normal text-zinc-500">shared across this page</span>
          </span>
          <input
            type="text"
            value={jobId}
            onChange={(e) => onJobIdChange(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            placeholder={fallbackJobId}
            className={fieldClass}
          />
        </label>
        <p className="mt-2 font-mono text-xs text-zinc-500">
          → <span className="text-zinc-700">{resolvedPath}</span>
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          Auto-filled when you run a chat, RAG, translate, or OCR job above. Edit manually if needed.
        </p>
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

type TemplateBuilderRow = { id: string; propertyKey: string; placeholder: string };

function stripDataUrlBase64(value: string): string {
  return value.replace(/^data:image\/[^;]+;base64,/, "").trim();
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(stripDataUrlBase64(String(reader.result ?? "")));
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function OcrImageField({
  imageBase64,
  imageLabel,
  onImageChange,
}: {
  imageBase64: string;
  imageLabel: string;
  onImageChange: (base64: string, label: string) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [pasteValue, setPasteValue] = useState("");

  const loadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const b64 = await fileToBase64(file);
    const label = `${file.name} (${Math.max(1, Math.round(file.size / 1024))} KB)`;
    onImageChange(b64, label);
    setPasteValue("");
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) void loadFile(file).catch(() => undefined);
  };

  return (
    <div className="mt-4 space-y-3">
      <p className="text-sm font-medium text-zinc-700">imageBase64</p>
      <div
        role="button"
        tabIndex={0}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            document.getElementById("ocr-docs-file-input")?.click();
          }
        }}
        className={[
          "flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors",
          dragOver ? "border-sky-400 bg-sky-50" : "border-zinc-300 bg-zinc-50/80 hover:border-zinc-400",
        ].join(" ")}
      >
        <p className="text-sm text-zinc-700">Drag and drop an image here</p>
        <p className="mt-1 text-xs text-zinc-500">PNG, JPEG, WebP, GIF</p>
        <label className="mt-3">
          <span className={`${btnSecondaryClass} cursor-pointer`}>Choose file</span>
          <input
            id="ocr-docs-file-input"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void loadFile(file).catch(() => undefined);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      {imageBase64 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          <span>Ready: {imageLabel || `${imageBase64.length.toLocaleString()} base64 chars`}</span>
          <button
            type="button"
            className="text-xs font-medium text-emerald-800 underline underline-offset-2"
            onClick={() => onImageChange("", "")}
          >
            Clear
          </button>
        </div>
      ) : null}

      <label className="block text-sm">
        <span className="font-medium text-zinc-700">Or paste base64 / data URL</span>
        <textarea
          value={pasteValue}
          onChange={(e) => {
            const v = e.target.value;
            setPasteValue(v);
            const stripped = stripDataUrlBase64(v);
            if (stripped) onImageChange(stripped, "Pasted base64");
          }}
          rows={3}
          spellCheck={false}
          placeholder="iVBORw0KGgo... or data:image/png;base64,..."
          className={fieldClass}
        />
      </label>
    </div>
  );
}

function ChatJobExamples({
  target,
  standaloneBase,
  nextAppBase,
  fixedTaskType,
  onJobIdCaptured,
}: {
  target: SnippetTarget;
  standaloneBase: string;
  nextAppBase: string;
  fixedTaskType?: TaskType;
  onJobIdCaptured?: (jobId: string) => void;
}) {
  const ctx = useApiDocsSettings();
  const [taskType, setTaskType] = useState<TaskType>(fixedTaskType ?? "chat");
  const [model, setModel] = useState("");
  const [role, setRole] = useState<MessageRole>("user");
  const [content, setContent] = useState("Hello");
  const [sourceLang, setSourceLang] = useState("English");
  const [sourceCode, setSourceCode] = useState("en");
  const [targetLang, setTargetLang] = useState("Indonesian");
  const [targetCode, setTargetCode] = useState("id");
  const [translateText, setTranslateText] = useState("Hello, how are you?");
  const [ocrMode, setOcrMode] = useState<OcrMode>("text");
  const [ocrImageBase64, setOcrImageBase64] = useState("");
  const [ocrImageLabel, setOcrImageLabel] = useState("");
  const [maxTokens, setMaxTokens] = useState("500");
  const [outputJsonTemplate, setOutputJsonTemplate] = useState("");
  const [generateSessionId, setGenerateSessionId] = useState(false);
  const [chatSessionId, setChatSessionId] = useState("");
  const [lastSessionId, setLastSessionId] = useState<string | null>(null);
  const [taskTypeOptions, setTaskTypeOptions] = useState<string[]>(() => [...TASK_TYPES]);
  const [modelOptions, setModelOptions] = useState<string[]>([]);
  const [builderRows, setBuilderRows] = useState<TemplateBuilderRow[]>(() => [
    { id: newRowId(), propertyKey: "color", placeholder: "$color" },
    { id: newRowId(), propertyKey: "uniqueName", placeholder: "$uniqueName" },
  ]);

  const effectiveTaskType = fixedTaskType ?? taskType;
  const isTranslate = effectiveTaskType === "translate";
  const isOcr = effectiveTaskType === "ocr";
  const isChatOrRag = effectiveTaskType === "chat" || effectiveTaskType === "rag";

  useEffect(() => {
    if (fixedTaskType) setTaskType(fixedTaskType);
  }, [fixedTaskType]);

  const applySessionFields = (base: Record<string, unknown>) => {
    if (generateSessionId) {
      base.generateSessionId = true;
    } else if (chatSessionId.trim()) {
      base.sessionId = chatSessionId.trim();
    }
    return base;
  };

  const body = useMemo(() => {
    const n = Number.parseInt(maxTokens, 10);
    const max = Number.isFinite(n) && n > 0 ? n : 500;

    if (isTranslate) {
      return applySessionFields({
        taskType: "translate",
        sourceLang: sourceLang.trim() || "English",
        sourceCode: sourceCode.trim() || "en",
        targetLang: targetLang.trim() || "Indonesian",
        targetCode: targetCode.trim() || "id",
        text: translateText.trim() || "Hello, how are you?",
        maxTokens: max,
      });
    }

    if (isOcr) {
      return applySessionFields({
        taskType: "ocr",
        imageBase64: ocrImageBase64.trim(),
        mode: ocrMode,
        maxTokens: max,
      });
    }

    const text = content.trim() || "Hello";
    const effectiveModel = model || modelOptions[0] || "";
    const base: Record<string, unknown> = {
      taskType: effectiveTaskType,
      model: effectiveModel,
      input: [{ role, content: text }],
      maxTokens: max,
    };
    const t = outputJsonTemplate.trim();
    if (t.length > 0) {
      base.outputJsonTemplate = t;
    }
    return applySessionFields(base);
  }, [
    effectiveTaskType,
    isTranslate,
    isOcr,
    ocrMode,
    ocrImageBase64,
    modelOptions,
    role,
    content,
    sourceLang,
    sourceCode,
    targetLang,
    targetCode,
    translateText,
    maxTokens,
    outputJsonTemplate,
    generateSessionId,
    chatSessionId,
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
        const res = await fetch(`${base}/api/v1/chat/models`, {
          method: "GET",
          headers: { "x-api-key": key },
        });
        const json = (await res.json().catch(() => null)) as {
          success?: boolean;
          data?: { taskTypes?: string[]; modelsByTask?: Record<string, string[]> } | string[];
        } | null;
        if (!res.ok || !json) return;
        const data = json.data ?? json;
        if (data && typeof data === "object" && !Array.isArray(data)) {
          const access = data as { taskTypes?: string[]; modelsByTask?: Record<string, string[]> };
          const list = access.taskTypes?.filter((x) => typeof x === "string") ?? [];
          if (list.length > 0) setTaskTypeOptions(list);
          const models =
            effectiveTaskType && access.modelsByTask?.[effectiveTaskType]
              ? access.modelsByTask[effectiveTaskType]!
              : Object.values(access.modelsByTask ?? {}).flat();
          if (models.length > 0) {
            setModelOptions(models);
            if (!models.includes(model)) setModel(models[0]!);
          }
        } else if (Array.isArray(data)) {
          const list = data.filter((x) => typeof x === "string");
          if (list.length > 0) {
            setModelOptions(list);
            if (!list.includes(model)) setModel(list[0]!);
          }
        }
      } catch {
        // ignore
      }
    })();
  }, [standaloneBase, ctx.apiKey, model, effectiveTaskType]);

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
    <div className="space-y-4">
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {!fixedTaskType ? (
            <SearchableSelect
              ui="square"
              label="taskType"
              value={taskType}
              onChange={(v) => setTaskType(v as TaskType)}
              options={taskTypeOptions.map((t) => ({ value: t, label: t }))}
            />
          ) : null}

          {!isTranslate && !isOcr ? (
            <SearchableSelect
              ui="square"
              label="model"
              value={model}
              onChange={(v) => setModel(v)}
              options={modelOptions.map((m) => ({ value: m, label: m }))}
            />
          ) : null}

          {isChatOrRag ? (
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
        ) : isOcr ? (
          <div className="mt-4">
            <SearchableSelect
              ui="square"
              label="mode"
              value={ocrMode}
              onChange={(v) => setOcrMode(v as OcrMode)}
              options={OCR_MODES.map((m) => ({
                value: m,
                label:
                  m === "text" ? "text — Text Recognition" : m === "formula" ? "formula — Formula Recognition" : "table — Table Recognition",
              }))}
            />
            <OcrImageField
              imageBase64={ocrImageBase64}
              imageLabel={ocrImageLabel}
              onImageChange={(b64, label) => {
                setOcrImageBase64(b64);
                setOcrImageLabel(label);
              }}
            />
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

        <div className="mt-4 space-y-3 rounded-lg border border-zinc-200 bg-zinc-50/80 p-3">
          <p className="text-xs font-semibold text-zinc-600">Chat session (optional)</p>
          <label className="flex items-center gap-2 text-sm text-zinc-800">
            <input
              type="checkbox"
              checked={generateSessionId}
              onChange={(e) => setGenerateSessionId(e.target.checked)}
              className="rounded border-zinc-300"
            />
            <span>generateSessionId — start a new 1-hour session</span>
          </label>
          <label className="block text-sm">
            <span className="font-medium text-zinc-700">sessionId</span>
            <input
              type="text"
              value={chatSessionId}
              onChange={(e) => setChatSessionId(e.target.value)}
              disabled={generateSessionId}
              placeholder="Continue an existing session"
              spellCheck={false}
              className={fieldClass}
            />
          </label>
          {lastSessionId ? (
            <p className="text-xs text-zinc-600">
              Last response session:{" "}
              <code className="rounded bg-white px-1 font-mono text-[11px]">{lastSessionId}</code>
            </p>
          ) : null}
        </div>

        {!isTranslate && !isOcr && effectiveTaskType === "chat" ? (
          <details className="mt-6 border-t border-zinc-200 pt-4">
            <summary className="cursor-pointer select-none text-sm font-medium text-zinc-700 marker:text-zinc-400 hover:text-zinc-900">
              Output JSON template (optional)
            </summary>
            <div className="mt-4 space-y-4">
              <p className="text-sm text-zinc-600">
                Sent as <code className="font-mono text-xs">outputJsonTemplate</code>. The server prepends a{" "}
                <code className="font-mono text-xs">system</code> message so the model replies with JSON
                matching this shape.
              </p>

              <label className="block text-sm">
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

              <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50/80 p-3">
                <p className="text-xs font-semibold text-zinc-600">Template builder</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Property keys and placeholder tokens (e.g. <code className="font-mono">$color</code>).
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
          </details>
        ) : null}
      </div>

      <SnippetBlocks
        req={req}
        baseHint={target === "standalone" ? "standalone" : "next"}
        runCredentials={target === "nextApp" ? "include" : "omit"}
        requiresApiKey
        apiKeyPresent={ctx.apiKey.trim().length > 0}
        onJobIdCaptured={onJobIdCaptured}
        onSessionCaptured={(session) => {
          setLastSessionId(session.id);
          setChatSessionId(session.id);
          setGenerateSessionId(false);
        }}
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
  onJobIdCaptured,
  onSessionCaptured,
}: {
  req: ReturnType<typeof resolveSnippetRequest>;
  baseHint: "standalone" | "next";
  runCredentials: RequestCredentials;
  requiresApiKey: boolean;
  apiKeyPresent: boolean;
  onJobIdCaptured?: (jobId: string) => void;
  onSessionCaptured?: (session: { id: string; expiresAt: string }) => void;
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
      if (res.ok && onJobIdCaptured) {
        const captured = extractJobIdFromResponse(text);
        if (captured) onJobIdCaptured(captured);
      }
      if (res.ok && onSessionCaptured) {
        try {
          const session = parseCreateJobSession(JSON.parse(text));
          if (session) onSessionCaptured(session);
        } catch {
          /* ignore */
        }
      }
      if (!res.ok) setRunError(banner);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setRunError(msg);
      setRunOutputHtml(await highlightRunResponse(msg));
    } finally {
      setRunLoading(false);
    }
  }, [req, runCredentials, requiresApiKey, apiKeyPresent, runLoading, onJobIdCaptured, onSessionCaptured]);

  return (
    <div className="min-w-0 max-w-full space-y-4">
      {requiresApiKey && !apiKeyPresent ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
          Configure your API key in <strong className="font-medium">API settings</strong> above to run
          requests.
        </p>
      ) : null}

      <div className="min-w-0 max-w-full overflow-hidden rounded-xl border border-sky-200/80 bg-white p-5 shadow-sm">
        <p className="break-all font-mono text-sm text-zinc-800">
          <span className="mr-2 inline-flex rounded bg-sky-100 px-1.5 py-0.5 font-bold text-sky-900">
            {req.method}
          </span>
          {req.url}
        </p>
        <button
          type="button"
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-40"
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
          <p className="mt-3 text-xs text-zinc-500">Response appears here after you run the request.</p>
        )}
        <p className="mt-3 text-xs text-zinc-500">
          {baseHint === "standalone"
            ? "Uses your configured base URL and API key."
            : "Uses this app origin; cookies included when relevant."}
        </p>
      </div>

      <details className="group min-w-0 max-w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50/50">
        <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-zinc-600 marker:text-zinc-400 hover:text-zinc-900">
          Code samples
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
                  <span className="sr-only">   {title}</span>
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
