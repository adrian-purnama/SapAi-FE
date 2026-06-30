"use client";

import Link from "next/link";
import { useEffect } from "react";

import { ApiEndpointSection } from "@/app/docs/components/ApiEndpointSection";
import { ApiHttpExamplesPanel } from "@/app/docs/components/ApiHttpExamplesPanel";
import { DocsAiPromptCopy } from "@/app/docs/components/DocsAiPromptCopy";
import { DocsCallout } from "@/app/docs/components/DocsCallout";
import { DocsPageHeader } from "@/app/docs/components/DocsPageHeader";
import { DocsSubsection } from "@/app/docs/components/DocsSubsection";

import {
  CHAT_AI_PROMPT,
  CHECK_JOB_AI_PROMPT,
  OCR_AI_PROMPT,
  RAG_AI_PROMPT,
  TRANSLATE_AI_PROMPT,
} from "./chatAiPrompts";
import { ChatJobsJobIdProvider, useChatJobsJobId } from "./ChatJobsJobIdContext";

function scrollToHash(hash: string) {
  const id = hash.replace(/^#/, "");
  if (!id) return;
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

const COMMON_POST_PARAMS = [
  {
    name: "taskType",
    type: "string",
    required: true,
    description: "Job kind. Same endpoint for all types; body shape depends on this field.",
  },
  {
    name: "maxTokens",
    type: "number",
    description: "Optional cap on completion tokens (default 500).",
  },
] as const;

const SESSION_PARAMS = [
  {
    name: "sessionId",
    type: "string",
    description: "Optional. Continue an active chat session (from a prior response or POST /chat-sessions).",
  },
  {
    name: "generateSessionId",
    type: "boolean",
    description: "Optional. When true, create a new session and return session.id (cannot combine with sessionId).",
  },
] as const;

function ChatJobsDocsBody() {
  const { jobId, setJobId, defaultJobId } = useChatJobsJobId();

  useEffect(() => {
    const go = () => scrollToHash(window.location.hash);
    go();
    window.addEventListener("hashchange", go);
    return () => window.removeEventListener("hashchange", go);
  }, []);

  return (
    <div className="space-y-14">
      <DocsPageHeader
        title="Chat jobs"
        description={
          <>
            All assistant tasks use one enqueue endpoint:{" "}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-sm">POST /api/v1/chat</code>.
            Every response returns a <code className="font-mono text-sm">job.id</code> you poll on the{" "}
            <a href="#check" className="font-medium text-sky-800 underline-offset-2 hover:underline">
              Check
            </a>{" "}
            section.
          </>
        }
      />

      <DocsSubsection variant="secondary" title="Quick start">
        <ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed text-zinc-700">
          <li>
            Set your API key in <strong className="font-medium text-zinc-900">API settings</strong> (toolbar above).
          </li>
          <li>
            Pick a task below — <a href="#chat" className="text-sky-800 hover:underline">Chat</a>,{" "}
            <a href="#rag" className="text-sky-800 hover:underline">RAG</a>,{" "}
            <a href="#translate" className="text-sky-800 hover:underline">Translate</a>, or{" "}
            <a href="#ocr" className="text-sky-800 hover:underline">OCR</a> — and click{" "}
            <strong className="font-medium text-zinc-900">Run request</strong>.
          </li>
          <li>
            Copy <code className="font-mono text-xs">job.id</code> from the response (auto-filled in{" "}
            <a href="#check" className="text-sky-800 hover:underline">Check</a>) and poll until{" "}
            <code className="font-mono text-xs">status</code> is <code className="font-mono text-xs">completed_full</code>.
          </li>
          <li>Read the answer from <code className="font-mono text-xs">result.text</code>.</li>
        </ol>
      </DocsSubsection>

      <DocsSubsection variant="muted" title="Endpoints at a glance" collapsible defaultOpen>
        <div className="overflow-x-auto rounded-lg border border-zinc-200">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Method
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Path
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Purpose
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white text-zinc-700">
              <tr>
                <td className="px-4 py-2.5 font-mono text-xs">POST</td>
                <td className="px-4 py-2.5 font-mono text-xs">/api/v1/chat</td>
                <td className="px-4 py-2.5">Enqueue chat, RAG, translate, or OCR job</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-mono text-xs">GET</td>
                <td className="px-4 py-2.5 font-mono text-xs">/api/v1/chat/jobs/:id</td>
                <td className="px-4 py-2.5">Poll job status and result</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-mono text-xs">POST</td>
                <td className="px-4 py-2.5 font-mono text-xs">/api/v1/chat-sessions</td>
                <td className="px-4 py-2.5">Create a multi-turn chat session (optional; see Chat sessions)</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-mono text-xs">DELETE</td>
                <td className="px-4 py-2.5 font-mono text-xs">/api/v1/chat-sessions/:id</td>
                <td className="px-4 py-2.5">End a chat session early</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-zinc-600">
          Auth: header <code className="font-mono text-xs">x-api-key</code> on HTTP requests.
        </p>
      </DocsSubsection>

      <section id="chat" className="scroll-mt-28">
        <ApiEndpointSection
          sectionHeading="Chat"
          method="POST"
          path="/api/v1/chat"
          authLabel="API key"
          description="Standard text completion. Send a model label from your plan and at least one message. Optional sessionId or generateSessionId enable multi-turn memory (full message history is rebuilt server-side)."
          parameters={[
            { name: "taskType", type: '"chat"', required: true, description: "Must be chat." },
            {
              name: "model",
              type: "string",
              required: true,
              description: (
                <>
                  Model label from{" "}
                  <Link href="/docs/api/server/models" className="text-sky-800 hover:underline">
                    GET /api/v1/chat/models
                  </Link>
                  .
                </>
              ),
            },
            {
              name: "input",
              type: "array",
              required: true,
              description: 'Messages with role ("user", "system", …) and content string.',
            },
            {
              name: "outputJsonTemplate",
              type: "string",
              description: "Optional JSON shape; server prepends a system message for structured output.",
            },
            ...SESSION_PARAMS,
            ...COMMON_POST_PARAMS.slice(1),
          ]}
          tryIt={<ApiHttpExamplesPanel variant="chatJob" fixedTaskType="chat" onJobIdCaptured={setJobId} />}
          exampleRequests={[
            {
              title: "Minimal",
              body: `{
  "taskType": "chat",
  "model": "<modelLabel>",
  "input": [{ "role": "user", "content": "Hello!" }],
  "maxTokens": 500
}`,
            },
          ]}
          exampleResponses={[
            {
              title: "200 — enqueued",
              body: `{
  "success": true,
  "data": {
    "job": {
      "id": "507f1f77bcf86cd799439011",
      "status": "pending",
      "taskType": "chat",
      "model": "<modelLabel>"
    }
  },
  "error": null
}`,
            },
          ]}
          reference={<DocsAiPromptCopy prompt={CHAT_AI_PROMPT} />}
        />
      </section>

      <section id="rag" className="scroll-mt-28">
        <ApiEndpointSection
          sectionHeading="RAG"
          method="POST"
          path="/api/v1/chat"
          authLabel="API key"
          description={
            <>
              Answers from FAQ knowledge uploaded in the{" "}
              <Link href="/dashboard" className="font-medium text-sky-800 underline-offset-2 hover:underline">
                dashboard
              </Link>
              . Same body shape as chat; set <code className="font-mono text-xs">taskType</code> to{" "}
              <code className="font-mono text-xs">rag</code>. Optional{" "}
              <code className="font-mono text-xs">sessionId</code> or{" "}
              <code className="font-mono text-xs">generateSessionId</code> start or continue a{" "}
              <a href="#chat-sessions" className="font-medium text-sky-800 underline-offset-2 hover:underline">
                chat session
              </a>{" "}
              (1-hour idle expiry). With a session, prior user/assistant turns are included in the job input; RAG
              retrieval still uses the latest user message. When the project has MCP enabled (dashboard → MCP tab), RAG
              jobs may route to external tools first: if required tool arguments are missing, the assistant reply asks
              for them (no FAQ/MCP call on that turn); on the next turn with a{" "}
              <code className="font-mono text-xs">sessionId</code>, the tool runs and the answer merges MCP output with
              FAQ retrieval.
            </>
          }
          parameters={[
            { name: "taskType", type: '"rag"', required: true, description: "Must be rag." },
            { name: "model", type: "string", required: true, description: "Model label allowed for rag on your plan." },
            { name: "input", type: "array", required: true, description: "User question in input[].content." },
            ...SESSION_PARAMS,
            ...COMMON_POST_PARAMS.slice(1),
          ]}
          tryIt={<ApiHttpExamplesPanel variant="chatJob" fixedTaskType="rag" onJobIdCaptured={setJobId} />}
          exampleRequests={[
            {
              title: "FAQ question",
              body: `{
  "taskType": "rag",
  "model": "<modelLabel>",
  "input": [{ "role": "user", "content": "What is the refund policy?" }],
  "maxTokens": 500
}`,
            },
            {
              title: "Start a session",
              body: `{
  "taskType": "rag",
  "model": "<modelLabel>",
  "generateSessionId": true,
  "input": [{ "role": "user", "content": "What is the refund policy?" }],
  "maxTokens": 500
}`,
            },
            {
              title: "Continue a session",
              body: `{
  "taskType": "rag",
  "model": "<modelLabel>",
  "sessionId": "507f1f77bcf86cd799439011",
  "input": [{ "role": "user", "content": "Can you summarize that in one sentence?" }],
  "maxTokens": 500
}`,
            },
            {
              title: "MCP — turn 1 (missing args)",
              body: `{
  "taskType": "rag",
  "model": "<modelLabel>",
  "sessionId": "507f1f77bcf86cd799439011",
  "input": [{ "role": "user", "content": "Tell me about my account" }],
  "maxTokens": 500
}`,
            },
            {
              title: "MCP — turn 2 (user supplies userId)",
              body: `{
  "taskType": "rag",
  "model": "<modelLabel>",
  "sessionId": "507f1f77bcf86cd799439011",
  "input": [{ "role": "user", "content": "usr_abc123" }],
  "maxTokens": 500
}`,
            },
          ]}
          exampleResponses={[
            {
              title: "200 — enqueued",
              body: `{
  "success": true,
  "data": {
    "job": {
      "id": "507f1f77bcf86cd799439011",
      "status": "pending",
      "taskType": "rag",
      "model": "<modelLabel>"
    },
    "session": {
      "id": "507f1f77bcf86cd799439012",
      "expiresAt": "2026-06-29T15:00:00.000Z"
    }
  },
  "error": null
}`,
            },
          ]}
          reference={<DocsAiPromptCopy prompt={RAG_AI_PROMPT} />}
        />
        <DocsCallout variant="info" title="MCP + RAG (multi-turn)" className="mt-6">
          <p className="text-sm leading-relaxed">
            Example with an MCP tool <code className="font-mono text-xs">get_account</code> that requires{" "}
            <code className="font-mono text-xs">userId</code>:
          </p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
            <li>
              User: “Tell me about my account” → assistant: “Can you provide your user ID?” (clarify; session stores
              both turns).
            </li>
            <li>
              User: “usr_abc123” → server calls MCP + FAQ retrieval → merged answer in{" "}
              <code className="font-mono text-xs">result.text</code>.
            </li>
          </ol>
          <p className="mt-2 text-sm leading-relaxed">
            Configure MCP URL and enable it on the project MCP tab; plan must include{" "}
            <code className="font-mono text-xs">allowMcp</code>. Embed widget uses the same RAG runner via{" "}
            <code className="font-mono text-xs">POST /api/v1/embed/chat</code> with{" "}
            <code className="font-mono text-xs">sessionId</code>.
          </p>
        </DocsCallout>
      </section>

      <section id="chat-sessions" className="scroll-mt-28">
        <ApiEndpointSection
          sectionHeading="Chat sessions"
          method="POST"
          path="/api/v1/chat-sessions"
          authLabel="API key"
          description={
            <>
              Create a standalone chat session for multi-visitor isolation on one API key. Works with all task types on{" "}
              <code className="font-mono text-xs">POST /api/v1/chat</code>. Sessions expire after{" "}
              <strong className="font-medium text-zinc-900">1 hour</strong> of idle time (sliding window refreshed on
              each valid <code className="font-mono text-xs">sessionId</code> use). End early with{" "}
              <code className="font-mono text-xs">DELETE /api/v1/chat-sessions/:id</code>. The public embed widget uses{" "}
              <code className="font-mono text-xs">POST /api/v1/embed/sessions</code> instead (embed token auth).
            </>
          }
          parameters={[]}
          tryIt={null}
          exampleRequests={[
            {
              title: "Create session",
              body: "(empty body)",
            },
          ]}
          exampleResponses={[
            {
              title: "201 — created",
              body: `{
  "success": true,
  "data": {
    "session": {
      "id": "507f1f77bcf86cd799439011",
      "expiresAt": "2026-06-29T15:00:00.000Z"
    }
  },
  "error": null
}`,
            },
          ]}
        />
        <DocsCallout variant="info" title="Memory per task type" className="mt-6">
          <ul className="list-disc space-y-1 pl-5 text-sm">
            <li>
              <strong>Chat / RAG</strong> — server stores each user turn and rebuilds full{" "}
              <code className="font-mono text-xs">input[]</code> from session messages.
            </li>
            <li>
              <strong>Translate</strong> — prior turns are prepended as plain text before the translate prompt for the
              current <code className="font-mono text-xs">text</code>.
            </li>
            <li>
              <strong>OCR</strong> — each job still sends only the current image; the session logs Q/A text (images are
              not replayed).
            </li>
          </ul>
        </DocsCallout>
        <div className="mt-8">
          <ApiEndpointSection
            sectionHeading="End chat session"
            method="DELETE"
            path="/api/v1/chat-sessions/:id"
            authLabel="API key"
            description="Mark a session ended. Idempotent if already ended."
            parameters={[
              { name: "id", type: "string", required: true, description: "Chat session id from create or chat response." },
            ]}
            tryIt={null}
            exampleResponses={[
              {
                title: "200 — ended",
                body: `{
  "success": true,
  "data": {
    "session": {
      "id": "507f1f77bcf86cd799439011",
      "expiresAt": "2026-06-29T15:00:00.000Z"
    }
  },
  "error": null
}`,
              },
            ]}
          />
        </div>
      </section>

      <section id="translate" className="scroll-mt-28">
        <ApiEndpointSection
          sectionHeading="Translate"
          method="POST"
          path="/api/v1/chat"
          authLabel="API key"
          description="Language translation. No model field — the server picks the translate model for your plan. Optional sessionId enables short conversation context before the current text."
          parameters={[
            { name: "taskType", type: '"translate"', required: true, description: "Must be translate." },
            { name: "sourceLang", type: "string", required: true, description: 'Display name, e.g. "English".' },
            { name: "sourceCode", type: "string", required: true, description: 'ISO-style code, e.g. "en".' },
            { name: "targetLang", type: "string", required: true, description: 'Display name, e.g. "Indonesian".' },
            { name: "targetCode", type: "string", required: true, description: 'ISO-style code, e.g. "id".' },
            { name: "text", type: "string", required: true, description: "Text to translate." },
            ...SESSION_PARAMS,
            ...COMMON_POST_PARAMS.slice(1),
          ]}
          tryIt={
            <ApiHttpExamplesPanel variant="chatJob" fixedTaskType="translate" onJobIdCaptured={setJobId} />
          }
          exampleRequests={[
            {
              title: "English → Indonesian",
              body: `{
  "taskType": "translate",
  "sourceLang": "English",
  "sourceCode": "en",
  "targetLang": "Indonesian",
  "targetCode": "id",
  "text": "Hello, how are you?",
  "maxTokens": 500
}`,
            },
          ]}
          exampleResponses={[
            {
              title: "200 — enqueued",
              body: `{
  "success": true,
  "data": {
    "job": {
      "id": "507f1f77bcf86cd799439011",
      "status": "pending",
      "taskType": "translate",
      "model": "TRANSLATE"
    }
  },
  "error": null
}`,
            },
          ]}
          reference={<DocsAiPromptCopy prompt={TRANSLATE_AI_PROMPT} />}
        />
      </section>

      <section id="ocr" className="scroll-mt-28">
        <ApiEndpointSection
          sectionHeading="OCR"
          method="POST"
          path="/api/v1/chat"
          authLabel="API key"
          description={
            <>
              Extract text, formulas, or tables from an image using the <code className="font-mono text-xs">ocr</code>{" "}
              model (<code className="font-mono text-xs">glm-ocr:bf16</code>). Send the image as base64 — raw or{" "}
              <code className="font-mono text-xs">data:image/…;base64,…</code>. No model field. Optional{" "}
              <code className="font-mono text-xs">sessionId</code> logs Q/A turns; each job still sends only the current
              image.
            </>
          }
          parameters={[
            { name: "taskType", type: '"ocr"', required: true, description: "Must be ocr." },
            {
              name: "imageBase64",
              type: "string",
              required: true,
              description:
                "Image as base64 (raw or data URL). Size limit is your plan maxOcrMb (decoded image bytes).",
            },
            {
              name: "mode",
              type: '"text" | "formula" | "table"',
              description: (
                <>
                  Recognition mode (default <code className="font-mono text-xs">text</code>). Maps to the user message
                  sent to the model.
                </>
              ),
            },
            ...SESSION_PARAMS,
            ...COMMON_POST_PARAMS.slice(1),
          ]}
          tryIt={<ApiHttpExamplesPanel variant="chatJob" fixedTaskType="ocr" onJobIdCaptured={setJobId} />}
          exampleRequests={[
            {
              title: "Text recognition",
              body: `{
  "taskType": "ocr",
  "imageBase64": "<base64-or-data-url>",
  "mode": "text",
  "maxTokens": 2048
}`,
            },
          ]}
          exampleResponses={[
            {
              title: "200 — enqueued",
              body: `{
  "success": true,
  "data": {
    "job": {
      "id": "507f1f77bcf86cd799439011",
      "status": "pending",
      "taskType": "ocr",
      "model": "ocr"
    }
  },
  "error": null
}`,
            },
          ]}
          reference={
            <>
              <DocsCallout variant="tip" title="Try it panel">
                Upload an image, drag and drop, or paste base64 directly. The request body uses your image; code
                samples omit the full string for readability.
              </DocsCallout>
              <DocsAiPromptCopy prompt={OCR_AI_PROMPT} />
            </>
          }
        />
      </section>

      <section id="check" className="scroll-mt-28 space-y-10">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900">Check job status</h2>
          <p className="mt-2 max-w-3xl text-base leading-relaxed text-zinc-600">
            Use the same <code className="font-mono text-xs">job.id</code> from any enqueue response. The field below
            updates automatically when you run a job above.
          </p>
        </div>

        <ApiEndpointSection
          method="GET"
          path="/api/v1/chat/jobs/:id"
          authLabel="API key"
          description={
            <>
              Poll until <code className="font-mono text-xs">status</code> is{" "}
              <code className="font-mono text-xs">completed_partial</code>,{" "}
              <code className="font-mono text-xs">completed_full</code>, or{" "}
              <code className="font-mono text-xs">failed</code>. RAG jobs may include{" "}
              <code className="font-mono text-xs">ragAnalysis</code> when ready.
            </>
          }
          parameters={[
            { name: "id", type: "string (path)", required: true, description: "Job id from POST /api/v1/chat response." },
          ]}
          tryIt={
            <ApiHttpExamplesPanel
              variant="jobPoll"
              jobId={jobId}
              onJobIdChange={setJobId}
              defaultJobId={defaultJobId}
            />
          }
          exampleResponses={[
            {
              title: "200 — completed",
              body: `{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "status": "completed_full",
    "taskType": "chat",
    "model": "<modelLabel>",
    "result": { "text": "…", "totalTokens": 30 },
    "error": null
  }
}`,
            },
            {
              title: "404 — unknown id or wrong key",
              body: `{ "success": false, "error": { "message": "Job not found" } }`,
            },
          ]}
          reference={<DocsAiPromptCopy prompt={CHECK_JOB_AI_PROMPT} />}
        />
      </section>
    </div>
  );
}

export function ChatJobsDocsContent() {
  return (
    <ChatJobsJobIdProvider>
      <ChatJobsDocsBody />
    </ChatJobsJobIdProvider>
  );
}
