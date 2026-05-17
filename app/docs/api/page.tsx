import type { Metadata } from "next";
import Link from "next/link";

import { getApiDocsHubCardItems } from "./docsNav";

export const metadata: Metadata = {
  title: "API documentation — SapAi",
  description: "SapAi standalone Fastify API and Next.js route handlers.",
};

export default function DocsApiHubPage() {
  const cards = getApiDocsHubCardItems();

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">API documentation</h1>
      <p className="mt-3 max-w-2xl text-zinc-600">
        Use <strong className="font-medium text-zinc-800">API settings</strong> above for the standalone Fastify base
        URL and your API key. Each endpoint page follows the same flow:{" "}
        <strong className="font-medium text-zinc-800">Try it</strong> (Run request + live response), then{" "}
        <strong className="font-medium text-zinc-800">Example payloads</strong>, then reference notes. Code samples
        (curl / JavaScript / Python) are in a collapsible section under Try it.
      </p>

      <section className="mt-6 rounded-xl border border-sky-200/80 bg-sky-50/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-900">Suggested path</p>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-sky-950">
          <li>
            <Link href="/docs/api/server/test" className="font-medium underline underline-offset-2 hover:text-sky-900">
              Test &amp; health
            </Link>{" "}
            — <code className="font-mono text-xs">/health</code>, then <code className="font-mono text-xs">/test/api-key</code>
          </li>
          <li>
            <Link href="/docs/api/server/models" className="font-medium underline underline-offset-2 hover:text-sky-900">
              Chat models
            </Link>
          </li>
          <li>
            <Link href="/docs/api/server/chat" className="font-medium underline underline-offset-2 hover:text-sky-900">
              Chat jobs
            </Link>{" "}
            — POST, poll GET, optional WebSocket
          </li>
          <li>
            <Link href="/docs/api/guides/embed" className="font-medium underline underline-offset-2 hover:text-sky-900">
              Embed widget (dashboard)
            </Link>{" "}
            +{" "}
            <Link href="/docs/api/server/embed" className="font-medium underline underline-offset-2 hover:text-sky-900">
              Public embed API
            </Link>
          </li>
        </ol>
      </section>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {cards.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow ${
              item.href === "/docs/api/next-handlers" ? "sm:col-span-2" : ""
            }`}
          >
            <h2 className="font-semibold text-zinc-900">{item.label}</h2>
            <p className="mt-2 text-sm text-zinc-600">{item.summary ?? ""}</p>
          </Link>
        ))}
      </div>

      <p className="mt-10 border-t border-zinc-200 pt-8 text-center text-sm text-zinc-500">
        <Link href="/dashboard" className="font-medium text-zinc-800 hover:underline">
          Dashboard
        </Link>
        {" · "}
        <Link href="/login" className="font-medium text-zinc-800 hover:underline">
          Login
        </Link>
      </p>
    </>
  );
}
