import type { Metadata } from "next";
import Link from "next/link";

import { ApiEndpointSection } from "@/app/docs/components/ApiEndpointSection";
import { ApiHttpExamplesPanel } from "@/app/docs/components/ApiHttpExamplesPanel";
import { CodeBlock } from "@/app/docs/components/docsCodeBlock";
import { MethodBadge } from "@/app/docs/components/docsMethodBadge";

export const metadata: Metadata = {
  title: "Standalone API — Chat jobs — SapAi",
  description: "Send chat and FAQ (RAG) messages, poll for answers, and stream job updates.",
};

export default function ServerChatDocsPage() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Chat jobs</h1>
      <p className="mt-3 max-w-2xl text-zinc-600">
        Send a message with <strong className="font-medium text-zinc-800">POST /api/v1/chat</strong> and you receive a{" "}
        <code className="rounded bg-zinc-100 px-1 font-mono text-xs">job.id</code>. Poll{" "}
        <strong className="font-medium text-zinc-800">GET /api/v1/chat/jobs/:id</strong> (or use the WebSocket below) until
        the answer is ready. Use <code className="font-mono text-xs">taskType: chat</code> for a normal assistant reply, or{" "}
        <code className="font-mono text-xs">taskType: rag</code> to answer from the FAQ documents you uploaded in the SapAi
        dashboard. Set your API key in the settings bar above before you run the examples.
      </p>

      <section className="mt-8 rounded-xl border border-zinc-200 bg-zinc-50/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Quick start</p>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-zinc-700">
          <li>
            <Link href="/docs/api/server/test" className="font-medium text-sky-800 underline-offset-2 hover:underline">
              Validate your API key
            </Link>{" "}
            and list{" "}
            <Link href="/docs/api/server/models" className="font-medium text-sky-800 underline-offset-2 hover:underline">
              allowed models
            </Link>
            .
          </li>
          <li>Upload FAQ knowledge in the dashboard (chunks + Qdrant vectors).</li>
          <li>
            <strong className="font-medium text-zinc-800">Run</strong>{" "}
            <code className="rounded bg-zinc-100 px-1 font-mono text-xs">POST /api/v1/chat</code> — copy{" "}
            <code className="font-mono text-xs">job.id</code> from the live response.
          </li>
          <li>
            <strong className="font-medium text-zinc-800">Run</strong>{" "}
            <code className="rounded bg-zinc-100 px-1 font-mono text-xs">GET /api/v1/chat/jobs/:id</code> until{" "}
            <code className="font-mono text-xs">completed_partial</code> or{" "}
            <code className="font-mono text-xs">completed_full</code> (or use WebSocket below).
          </li>
        </ol>
      </section>

      <div className="mt-10 space-y-0">
        <ApiEndpointSection
          method="POST"
          path="/api/v1/chat"
          authLabel="API key · JSON body"
          description={
            <>
              Requires <code className="rounded bg-zinc-100 px-1 font-mono text-xs">Content-Type: application/json</code>{" "}
              and <code className="rounded bg-zinc-100 px-1 font-mono text-xs">x-api-key</code>. Optional{" "}
              <code className="font-mono text-xs">outputJsonTemplate</code> asks for structured JSON.{" "}
              <code className="font-mono text-xs">taskType</code>{" "}
              <code className="font-mono text-xs">chat</code> = completion;{" "}
              <code className="font-mono text-xs">rag</code> = FAQ vector search then answer.
            </>
          }
          tryIt={<ApiHttpExamplesPanel variant="chatJob" />}
          exampleRequests={[
            {
              title: "Minimal chat",
              body: `{
  "taskType": "chat",
  "model": "OCT3Q",
  "input": [{ "role": "user", "content": "Hello!" }]
}`,
            },
            {
              title: "RAG (FAQ knowledge)",
              body: `{
  "taskType": "rag",
  "model": "OCT3Q",
  "input": [{ "role": "user", "content": "What is the refund policy?" }]
}`,
            },
          ]}
          exampleResponses={[
            {
              title: "200 OK — enqueue (copy job.id)",
              body: `{
  "ok": true,
  "job": {
    "id": "507f1f77bcf86cd799439011",
    "status": "pending",
    "taskType": "rag",
    "model": "OCT3Q"
  }
}`,
            },
          ]}
        />

        <ApiEndpointSection
          method="GET"
          path="/api/v1/chat/jobs/:id"
          authLabel="API key"
          description={
            <>
              Paste <code className="font-mono text-xs">job.id</code> from POST. Embed jobs may use{" "}
              <code className="font-mono text-xs">x-embed-token</code> (
              <Link href="/docs/api/server/embed" className="font-medium text-sky-800 underline-offset-2 hover:underline">
                Public embed
              </Link>
              ). RAG jobs include <code className="font-mono text-xs">ragAnalysis</code> when ready.
            </>
          }
          tryIt={
            <ApiHttpExamplesPanel
              variant="simple"
              target="standalone"
              method="GET"
              path="/api/v1/chat/jobs/507f1f77bcf86cd799439011"
              jobIdPathPrefix="/api/v1/chat/jobs"
              defaultJobId="507f1f77bcf86cd799439011"
              apiKey
            />
          }
          exampleResponses={[
            {
              title: "200 OK — completed",
              body: `{
  "id": "507f1f77bcf86cd799439011",
  "status": "completed_full",
  "taskType": "chat",
  "model": "OCT3Q",
  "result": { "text": "…", "totalTokens": 30 },
  "error": null
}`,
            },
            {
              title: "404 — unknown id or wrong key",
              body: `{ "message": "Job not found" }`,
            },
          ]}
        />
      </div>

      <section className="mt-10 scroll-mt-24 border-b border-zinc-200 pb-10">
        <div className="flex flex-wrap items-center gap-2">
          <MethodBadge method="GET" />
          <code className="font-mono text-sm text-zinc-800">/api/v1/chat/jobs/:id/stream</code>
          <span className="text-sm text-zinc-500">WebSocket</span>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-zinc-700">
          After POST returns <code className="font-mono text-xs">job.id</code>, open a WebSocket (cannot use Run in
          browser for all hosts, build the URL manually). Query{" "}
          <code className="font-mono text-xs">apiKey</code> or <code className="font-mono text-xs">embedToken</code> must
          match the job. Prefer <code className="font-mono text-xs">wss://</code> in production.
        </p>
        <div className="mt-6 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Example URLs</p>
          <CodeBlock title="API key">{`wss://YOUR_HOST/api/v1/chat/jobs/JOB_ID/stream?apiKey=YOUR_API_KEY`}</CodeBlock>
          <CodeBlock title="Embed token">{`wss://YOUR_HOST/api/v1/chat/jobs/JOB_ID/stream?embedToken=YOUR_EMBED_TOKEN`}</CodeBlock>
          <CodeBlock title="First message (same shape as GET job)">{`{
  "id": "507f1f77bcf86cd799439011",
  "status": "running",
  "taskType": "rag",
  "result": null,
  "error": null
}`}</CodeBlock>
        </div>
      </section>
    </>
  );
}
