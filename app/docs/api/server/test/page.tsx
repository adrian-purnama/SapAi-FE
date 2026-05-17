import type { Metadata } from "next";

import { ApiEndpointSection } from "@/app/docs/components/ApiEndpointSection";
import { ApiHttpExamplesPanel } from "@/app/docs/components/ApiHttpExamplesPanel";
import { CodeBlock } from "@/app/docs/components/docsCodeBlock";
import { MethodBadge } from "@/app/docs/components/docsMethodBadge";

export const metadata: Metadata = {
  title: "Standalone API — Test & health — SapAi",
  description: "Health and connectivity endpoints for the SapAi Fastify server.",
};

export default function ServerTestDocsPage() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Test Api Key</h1>
      <p className="mt-3 max-w-2xl text-zinc-600">
        Operational endpoints on the standalone server. Use <strong className="font-medium text-zinc-800">GET /test/api-key</strong>{" "}
        below to validate your key (interactive Run + example responses); <code className="font-mono text-xs">/health</code> and{" "}
        <code className="font-mono text-xs">/test</code> are simple public probes.
      </p>

      <ApiEndpointSection
        className="mt-10 border-b-0 pb-4"
        method="GET"
        path="/test/api-key"
        authLabel="API key"
        description={
          <>
            Validates <code className="rounded bg-zinc-100 px-1 font-mono text-xs">x-api-key</code> against MongoDB and
            returns your subscription plan limits (requests per minute and max characters per message). Set your key in{" "}
            <strong className="font-medium text-zinc-800">API settings</strong> at the top of the page, then Run below.
          </>
        }
        tryIt={
          <ApiHttpExamplesPanel
            variant="simple"
            target="standalone"
            method="GET"
            path="/test/api-key"
            apiKey
          />
        }
        exampleResponses={[
          {
            title: "200 OK — key valid",
            body: `{
  "ok": true,
  "label": "Production server",
  "planName": "Pro",
  "rateLimitPerMinute": 60,
  "maxCharacterPerMessage": 4000
}`,
          },
          {
            title: "401 — missing or invalid key",
            body: `{
  "message": "Invalid or missing API key."
}`,
          },
        ]}
      />
    </>
  );
}
