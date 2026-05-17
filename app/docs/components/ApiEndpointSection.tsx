import type { ReactNode } from "react";

import { CodeBlock } from "@/app/docs/components/docsCodeBlock";
import { MethodBadge } from "@/app/docs/components/docsMethodBadge";

export type ApiDocExample = { title: string; body: string };

type Props = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
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

export function ApiEndpointSection({
  method,
  path,
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
    <section className={`scroll-mt-24 border-b border-zinc-200 pb-10 ${className}`.trim()}>
      <div className="flex flex-wrap items-center gap-2">
        <MethodBadge method={method} />
        <code className="font-mono text-sm text-zinc-800">{path}</code>
        {authLabel ? <span className="text-sm text-zinc-500">{authLabel}</span> : null}
      </div>

      <div className="mt-4 text-sm leading-relaxed text-zinc-700">{description}</div>

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">1 · Try it</p>
        <p className="mt-1 text-xs text-zinc-600">
          Set your credentials in <strong className="font-medium text-zinc-800">API settings</strong> at
          the top of the page, then click <strong className="font-medium text-zinc-800">Run request</strong>. Your live
          response appears below the button.
        </p>
        <div className="mt-3">{tryIt}</div>
      </div>

      {hasExamples ? (
        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">2 · Example payloads</p>
          <p className="mt-1 text-xs text-zinc-600">
            Reference shapes — your live response may differ slightly (ids, timestamps, plan limits).
          </p>
          <div className="mt-3 space-y-3">
            {exampleRequests.map((ex) => (
              <CodeBlock key={`req-${ex.title}`} title={ex.title}>
                {ex.body}
              </CodeBlock>
            ))}
            {exampleResponses.map((ex) => (
              <CodeBlock key={`res-${ex.title}`} title={ex.title}>
                {ex.body}
              </CodeBlock>
            ))}
          </div>
        </div>
      ) : null}

      {reference ? (
        <div className={hasExamples ? "mt-6" : "mt-8"}>
          {hasExamples ? (
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">3 · Reference</p>
          ) : (
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">2 · Reference</p>
          )}
          <div className="space-y-3 text-sm leading-relaxed text-zinc-700">{reference}</div>
        </div>
      ) : null}
    </section>
  );
}
