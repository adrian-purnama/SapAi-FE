import type { ReactNode } from "react";

import { CodeBlock } from "@/app/docs/components/docsCodeBlock";
import { DocsSubsection } from "@/app/docs/components/DocsSubsection";
import { MethodBadge } from "@/app/docs/components/docsMethodBadge";

export type ApiDocExample = { title: string; body: string };

type Props = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  /** Optional page section label above the endpoint card (e.g. Chat, RAG). */
  sectionHeading?: string;
  sectionId?: string;
  /** e.g. "Public", "API key", "Embed token" */
  authLabel?: string;
  description: ReactNode;
  /** Interactive panel — configure fields, Run request, live response. */
  tryIt: ReactNode;
  exampleRequests?: ApiDocExample[];
  exampleResponses?: ApiDocExample[];
  /** Extra reference below examples (errors, WebSocket notes, links). */
  reference?: ReactNode;
  className?: string;
};

function AuthPill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
      {label}
    </span>
  );
}

export function ApiEndpointSection({
  method,
  path,
  sectionHeading,
  sectionId,
  authLabel,
  description,
  tryIt,
  exampleRequests = [],
  exampleResponses = [],
  reference,
  className = "",
}: Props) {
  const hasExamples = exampleRequests.length > 0 || exampleResponses.length > 0;

  return (
    <article id={sectionId} className={`min-w-0 scroll-mt-24 space-y-8 ${className}`.trim()}>
      {sectionHeading ? (
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900">{sectionHeading}</h2>
      ) : null}
      <header className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <MethodBadge method={method} />
          <code className="font-mono text-base font-semibold text-zinc-900">{path}</code>
          {authLabel ? <AuthPill label={authLabel} /> : null}
        </div>
        <div className="mt-4 text-base leading-relaxed text-zinc-600">{description}</div>
      </header>

      <DocsSubsection variant="primary" title="Try it">
        {tryIt}
      </DocsSubsection>

      {hasExamples ? (
        <DocsSubsection
          variant="secondary"
          title="Example payloads"
          description="Reference shapes — your live response may differ (ids, timestamps, plan limits)."
        >
          {exampleRequests.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Requests</p>
              <div className="space-y-3">
                {exampleRequests.map((ex) => (
                  <CodeBlock key={`req-${ex.title}`} title={ex.title} variant="request">
                    {ex.body}
                  </CodeBlock>
                ))}
              </div>
            </div>
          ) : null}
          {exampleResponses.length > 0 ? (
            <div className={exampleRequests.length > 0 ? "mt-6 space-y-3" : "space-y-3"}>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Responses</p>
              <div className="space-y-3">
                {exampleResponses.map((ex) => (
                  <CodeBlock key={`res-${ex.title}`} title={ex.title} variant="response">
                    {ex.body}
                  </CodeBlock>
                ))}
              </div>
            </div>
          ) : null}
        </DocsSubsection>
      ) : null}

      {reference ? (
        <DocsSubsection variant="muted" title="Reference" collapsible defaultOpen={false}>
          <div className="space-y-3 text-sm leading-relaxed text-zinc-700">{reference}</div>
        </DocsSubsection>
      ) : null}
    </article>
  );
}
