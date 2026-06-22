"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight, RefreshCw } from "lucide-react";
import { useAdminChatJob, type AdminChatJob } from "./useAdminChatJob";

function fmt(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
      <div className="mt-3 space-y-2 text-sm text-zinc-700">{children}</div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-wrap gap-x-2 gap-y-1">
      <span className="min-w-[7rem] text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</span>
      <span className="min-w-0 flex-1 break-all font-mono text-xs text-zinc-800">{value}</span>
    </div>
  );
}

function MessageList({ input }: { input: AdminChatJob["input"] }) {
  if (!input.length) return <p className="text-zinc-500">No messages.</p>;
  return (
    <ul className="space-y-3">
      {input.map((m, i) => (
        <li key={i} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
          <p className="text-xs font-semibold uppercase text-zinc-500">{m.role}</p>
          <pre className="mt-1 whitespace-pre-wrap break-words font-sans text-sm text-zinc-900">{m.content}</pre>
        </li>
      ))}
    </ul>
  );
}

export default function AdminChatJobDetailPanel({ jobId }: { jobId: string }) {
  const { job, loading, error, refetch, hasAuth } = useAdminChatJob(jobId);
  const [jsonOpen, setJsonOpen] = useState(false);

  if (!hasAuth) {
    return (
      <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Authentication required (admin).
      </p>
    );
  }

  if (loading) return <p className="mt-6 text-sm text-zinc-600">Loading job…</p>;
  if (error) {
    return (
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <p className="text-sm text-zinc-600">{error}</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
        >
          Retry
        </button>
      </div>
    );
  }
  if (!job) {
    return (
      <p className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
        Job not found.
      </p>
    );
  }

  const j = job;

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => void refetch()}
          className="inline-flex h-9 items-center rounded-lg border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
        >
          <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
          Refresh
        </button>
      </div>

      <Section title="Meta">
        <MetaRow label="ID" value={j.id} />
        <MetaRow label="Status" value={j.status} />
        <MetaRow label="Task" value={j.taskType} />
        <MetaRow label="Model" value={j.model} />
        <MetaRow label="Plan" value={j.plan} />
        <MetaRow label="Max tokens" value={String(j.maxTokens)} />
        <MetaRow label="useDeepSeek" value={j.useDeepSeek == null ? "null" : String(j.useDeepSeek)} />
        <MetaRow label="Attempts" value={`${j.attempts} / ${j.maxAttempts}`} />
        <MetaRow label="User" value={
          j.userEmail ? (
            <Link href={`/admin/users/${j.userId}`} className="text-violet-700 hover:underline">
              {j.userEmail}
            </Link>
          ) : (
            j.userId
          )
        } />
        <MetaRow label="User ID" value={j.userId} />
        <MetaRow label="API key ID" value={j.apiKeyId} />
        <MetaRow label="Created" value={fmt(j.createdAt)} />
        <MetaRow label="Started" value={fmt(j.startedAt)} />
        <MetaRow label="Finished" value={fmt(j.finishedAt)} />
        <MetaRow label="Updated" value={fmt(j.updatedAt)} />
      </Section>

      <Section title="Input">
        <MessageList input={j.input} />
      </Section>

      <Section title="Result">
        {j.result ? (
          <>
            {j.result.text ? (
              <pre className="whitespace-pre-wrap break-words rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-900">
                {j.result.text}
              </pre>
            ) : null}
            {j.result.json != null ? (
              <pre className="mt-2 overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-800">
                {JSON.stringify(j.result.json, null, 2)}
              </pre>
            ) : null}
            <p className="text-xs text-zinc-600">
              Tokens: {j.result.promptTokens} prompt · {j.result.completionTokens} completion ·{" "}
              {j.result.totalTokens} total
            </p>
          </>
        ) : (
          <p className="text-zinc-500">No result yet.</p>
        )}
      </Section>

      {j.ragAnalysis ? (
        <Section title="RAG analysis">
          <MetaRow label="Category" value={j.ragAnalysis.category ?? "—"} />
          <MetaRow label="Answerable" value={j.ragAnalysis.answerable ?? "—"} />
          <MetaRow label="Intent" value={j.ragAnalysis.intent ?? "—"} />
        </Section>
      ) : null}

      {j.error ? (
        <Section title="Error">
          <MetaRow label="Code" value={j.error.code ?? "—"} />
          <MetaRow label="Message" value={j.error.message ?? "—"} />
        </Section>
      ) : null}

      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setJsonOpen((o) => !o)}
          className="flex w-full items-center gap-2 px-5 py-4 text-left text-sm font-semibold text-zinc-900"
        >
          {jsonOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          Full JSON
        </button>
        {jsonOpen ? (
          <pre className="max-h-[32rem] overflow-auto border-t border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-800">
            {JSON.stringify(j, null, 2)}
          </pre>
        ) : null}
      </div>
    </div>
  );
}
