import type { Metadata } from "next";
import Link from "next/link";

import { ApiEndpointSection } from "@/app/docs/components/ApiEndpointSection";
import { ApiHttpExamplesPanel } from "@/app/docs/components/ApiHttpExamplesPanel";

export const metadata: Metadata = {
  title: "Standalone API — Chat models — SapAi",
  description: "List allowed model labels for chat jobs.",
};

export default function ServerModelsDocsPage() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Chat models</h1>
      <p className="mt-3 max-w-2xl text-zinc-600">
        Allow-list for model labels used with{" "}
        <Link href="/docs/api/server/chat" className="font-medium text-sky-800 underline-offset-2 hover:underline">
          POST /api/v1/chat
        </Link>{" "}
        and{" "}
        <Link href="/docs/api/server/embed" className="font-medium text-sky-800 underline-offset-2 hover:underline">
          POST /api/v1/embed/chat
        </Link>
        . Run the request below after{" "}
        <Link href="/docs/api/server/test" className="font-medium text-sky-800 underline-offset-2 hover:underline">
          validating your API key
        </Link>
        .
      </p>

      <ApiEndpointSection
        className="mt-10 border-b-0 pb-4"
        method="GET"
        path="/api/v1/chat/models"
        authLabel="API key"
        description={
          <>
            Requires header <code className="rounded bg-zinc-100 px-1 font-mono text-xs">x-api-key</code>. Returns a
            JSON array of model id strings you may pass as <code className="font-mono text-xs">model</code> on chat
            requests.
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
    </>
  );
}
