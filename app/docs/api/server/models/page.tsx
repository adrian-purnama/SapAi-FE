import type { Metadata } from "next";
import Link from "next/link";

import { ApiEndpointSection } from "@/app/docs/components/ApiEndpointSection";
import { ApiHttpExamplesPanel } from "@/app/docs/components/ApiHttpExamplesPanel";
import { DocsPageHeader } from "@/app/docs/components/DocsPageHeader";

export const metadata: Metadata = {
  title: "Standalone API — Chat models — SapAi",
  description: "List allowed model labels for chat jobs.",
};

export default function ServerModelsDocsPage() {
  return (
    <div className="space-y-12">
      <DocsPageHeader
        title="Chat models"
        description={
          <>
            Allow-list for model labels used with{" "}
            <Link href="/docs/api/server/chat" className="font-medium text-sky-800 underline-offset-2 hover:underline">
              POST /api/v1/chat
            </Link>
            . Validate your key on the{" "}
            <Link href="/docs/api/server/test" className="font-medium text-sky-800 underline-offset-2 hover:underline">
              test page
            </Link>{" "}
            first.
          </>
        }
      />

      <ApiEndpointSection
        method="GET"
        path="/api/v1/chat/models"
        authLabel="API key"
        description={
          <>
            Requires header <code className="rounded bg-zinc-100 px-1 font-mono text-xs">x-api-key</code>. Returns a
            JSON array of model id strings for chat requests.
          </>
        }
        tryIt={
          <ApiHttpExamplesPanel
            variant="simple"
            target="standalone"
            method="GET"
            path="/api/v1/chat/models"
            apiKey
          />
        }
        exampleResponses={[
          {
            title: "200 OK",
            body: `[
  "OCT3Q"
]`,
          },
        ]}
      />
    </div>
  );
}
