import type { Metadata } from "next";

import { ApiEndpointSection } from "@/app/docs/components/ApiEndpointSection";
import { ApiHttpExamplesPanel } from "@/app/docs/components/ApiHttpExamplesPanel";
import { DocsPageHeader } from "@/app/docs/components/DocsPageHeader";

export const metadata: Metadata = {
  title: "Standalone API   Test & health   SapAi",
  description: "Health and connectivity endpoints for the SapAi Fastify server.",
};

export default function ServerTestDocsPage() {
  return (
    <div className="space-y-12">
      <DocsPageHeader
        title="Test API key"
        description={
          <>
            Validate your <code className="rounded bg-zinc-100 px-1 font-mono text-xs">x-api-key</code> and check
            subscription limits. Use <code className="font-mono text-xs">/health</code> and{" "}
            <code className="font-mono text-xs">/test</code> for simple public probes.
          </>
        }
      />

      <ApiEndpointSection
        method="GET"
        path="/test/api-key"
        authLabel="API key"
        description={
          <>
            Returns your subscription plan limits (requests per minute and max characters per message) when the key is
            valid.
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
            title: "200 OK   key valid",
            body: `{
  "ok": true,
  "label": "Production server",
  "planName": "Pro",
  "rateLimitPerMinute": 60,
  "maxCharacterPerMessage": 4000
}`,
          },
          {
            title: "401   missing or invalid key",
            body: `{
  "message": "Invalid or missing API key."
}`,
          },
        ]}
      />
    </div>
  );
}
