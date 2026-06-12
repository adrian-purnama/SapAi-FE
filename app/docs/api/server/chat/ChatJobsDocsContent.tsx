"use client";

import Link from "next/link";
import { useEffect } from "react";

import { ApiEndpointSection } from "@/app/docs/components/ApiEndpointSection";
import { ApiHttpExamplesPanel } from "@/app/docs/components/ApiHttpExamplesPanel";
import { DocsAiPromptCopy } from "@/app/docs/components/DocsAiPromptCopy";
import { DocsCallout } from "@/app/docs/components/DocsCallout";
import { DocsPageHeader } from "@/app/docs/components/DocsPageHeader";

import {
  CHAT_AI_PROMPT,
  CHECK_JOB_AI_PROMPT,
  RAG_AI_PROMPT,
  TRANSLATE_AI_PROMPT,
} from "./chatAiPrompts";
import { ChatJobsJobIdProvider, useChatJobsJobId } from "./ChatJobsJobIdContext";

function scrollToHash(hash: string) {
  const id = hash.replace(/^#/, "");
  if (!id) return;
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function ChatJobsDocsBody() {
  const { jobId, setJobId, defaultJobId } = useChatJobsJobId();

  useEffect(() => {
    const go = () => scrollToHash(window.location.hash);
    go();
    window.addEventListener("hashchange", go);
    return () => window.removeEventListener("hashchange", go);
  }, []);

  return (
    <div className="space-y-16">
      <DocsPageHeader
        title="Chat jobs"
        description={
          <>
            Each task type enqueues with <strong className="font-medium text-zinc-800">POST /api/v1/chat</strong>.
            One shared <code className="rounded bg-zinc-100 px-1 font-mono text-xs">job.id</code> field in{" "}
            <a href="#check" className="font-medium text-sky-800 underline-offset-2 hover:underline">
              Check
            </a>{" "}
            is used to poll and stream — no need to switch pages.
          </>
        }
      >
        <DocsCallout variant="tip" title="On this page">
          <ol className="list-inside list-decimal space-y-1.5">
            <li>
              <a href="#chat" className="font-medium text-sky-800 underline-offset-2 hover:underline">
                Chat
              </a>
              ,{" "}
              <a href="#rag" className="font-medium text-sky-800 underline-offset-2 hover:underline">
                RAG
              </a>
              , or{" "}
              <a href="#translate" className="font-medium text-sky-800 underline-offset-2 hover:underline">
                Translate
              </a>{" "}
              — Run POST and copy <code className="font-mono text-xs">job.id</code> (auto-filled below).
            </li>
            <li>
              <a href="#check" className="font-medium text-sky-800 underline-offset-2 hover:underline">
                Check
              </a>{" "}
              — poll <code className="font-mono text-xs">GET /api/v1/chat/jobs/:id</code> or open the WebSocket URL.
            </li>
            <li>
              Lazy? Use <strong className="font-medium">Copy AI prompt</strong> in any section and paste into your AI
              assistant.
            </li>
          </ol>
        </DocsCallout>
      </DocsPageHeader>

      <section id="chat" className="scroll-mt-28 space-y-4">
        <DocsAiPromptCopy prompt={CHAT_AI_PROMPT} />
        <ApiEndpointSection
          sectionHeading="Chat"
          method="POST"
          path="/api/v1/chat"
          authLabel="API key · taskType chat"
          description="Standard assistant completion. Pick a model from the allow-list and send one user message."
          tryIt={
            <ApiHttpExamplesPanel
              variant="chatJob"
              fixedTaskType="chat"
              onJobIdCaptured={setJobId}
            />
          }
          exampleRequests={[
            {
              title: "Minimal chat",
              body: `{
  "taskType": "chat",
  "model": "OCT3Q",
  "input": [{ "role": "user", "content": "Hello!" }],
  "maxTokens": 500
}`,
            },
          ]}
          exampleResponses={[
            {
              title: "200 OK — enqueue",
              body: `{
  "ok": true,
  "job": {
    "id": "507f1f77bcf86cd799439011",
    "status": "pending",
    "taskType": "chat",
    "model": "OCT3Q"
  }
}`,
            },
          ]}
        />
      </section>

      <section id="rag" className="scroll-mt-28 space-y-4">
        <DocsAiPromptCopy prompt={RAG_AI_PROMPT} />
        <ApiEndpointSection
          sectionHeading="RAG"
          method="POST"
          path="/api/v1/chat"
          authLabel="API key · taskType rag"
          description={
            <>
              Answers from FAQ knowledge uploaded in the{" "}
              <Link href="/dashboard" className="font-medium text-sky-800 underline-offset-2 hover:underline">
                dashboard
              </Link>
              . Same enqueue endpoint; set <code className="font-mono text-xs">taskType</code> to{" "}
              <code className="font-mono text-xs">rag</code>.
            </>
          }
          tryIt={
            <ApiHttpExamplesPanel variant="chatJob" fixedTaskType="rag" onJobIdCaptured={setJobId} />
          }
          exampleRequests={[
            {
              title: "FAQ question",
              body: `{
  "taskType": "rag",
  "model": "OCT3Q",
  "input": [{ "role": "user", "content": "What is the refund policy?" }],
  "maxTokens": 500
}`,
            },
          ]}
          exampleResponses={[
            {
              title: "200 OK — enqueue",
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
      </section>

      <section id="translate" className="scroll-mt-28 space-y-4">
        <DocsAiPromptCopy prompt={TRANSLATE_AI_PROMPT} />
        <ApiEndpointSection
          sectionHeading="Translate"
          method="POST"
          path="/api/v1/chat"
          authLabel="API key · taskType translate"
          description={
            <>
              Language translation via Ollama translate model. No <code className="font-mono text-xs">model</code> field —
              use <code className="font-mono text-xs">sourceLang</code>, <code className="font-mono text-xs">targetLang</code>
              , and <code className="font-mono text-xs">text</code>.
            </>
          }
          tryIt={
            <ApiHttpExamplesPanel
              variant="chatJob"
              fixedTaskType="translate"
              onJobIdCaptured={setJobId}
            />
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
              title: "200 OK — enqueue",
              body: `{
  "ok": true,
  "job": {
    "id": "507f1f77bcf86cd799439011",
    "status": "pending",
    "taskType": "translate",
    "model": "TRANSLATE"
  }
}`,
            },
          ]}
        />
      </section>

      <section id="check" className="scroll-mt-28 space-y-8">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900">Check</h2>
          <p className="text-base leading-relaxed text-zinc-600">
            After any POST above, use the same <code className="font-mono text-xs">job.id</code> here to poll or stream.
            The field below is shared — Run a chat/RAG/translate job and it updates automatically.
          </p>
          <DocsAiPromptCopy prompt={CHECK_JOB_AI_PROMPT} />
        </div>

        <ApiEndpointSection
          method="GET"
          path="/api/v1/chat/jobs/:id"
          authLabel="API key · poll"
          description={
            <>
              Repeat until <code className="font-mono text-xs">status</code> is{" "}
              <code className="font-mono text-xs">completed_partial</code> or{" "}
              <code className="font-mono text-xs">completed_full</code>. RAG jobs include{" "}
              <code className="font-mono text-xs">ragAnalysis</code> when ready.
            </>
          }
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

        <ApiEndpointSection
          method="GET"
          path="/api/v1/chat/jobs/:id/stream"
          authLabel="WebSocket"
          description={
            <>
              Optional real-time updates instead of polling. Query{" "}
              <code className="font-mono text-xs">apiKey</code> or <code className="font-mono text-xs">embedToken</code>{" "}
              must match the job. Use <code className="font-mono text-xs">wss://</code> in production. Replace{" "}
              <code className="font-mono text-xs">JOB_ID</code> with the shared id above (
              <code className="font-mono text-xs">{jobId || defaultJobId}</code>).
            </>
          }
          tryIt={
            <p className="text-sm text-zinc-600">
              WebSocket cannot be tested with Run in the browser. Copy a URL below and use your{" "}
              <code className="font-mono text-xs">JOB_ID</code> from the shared field.
            </p>
          }
          exampleRequests={[
            {
              title: "API key",
              body: `wss://YOUR_HOST/api/v1/chat/jobs/${jobId || "JOB_ID"}/stream?apiKey=YOUR_API_KEY`,
            },
            {
              title: "Embed token",
              body: `wss://YOUR_HOST/api/v1/chat/jobs/${jobId || "JOB_ID"}/stream?embedToken=YOUR_EMBED_TOKEN`,
            },
          ]}
          exampleResponses={[
            {
              title: "First message (same shape as GET job)",
              body: `{
  "id": "507f1f77bcf86cd799439011",
  "status": "running",
  "taskType": "rag",
  "result": null,
  "error": null
}`,
            },
          ]}
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
