import type { Metadata } from "next";
import Link from "next/link";

import { DocsCallout } from "@/app/docs/components/DocsCallout";
import { DocsPageHeader } from "@/app/docs/components/DocsPageHeader";

import { API_DOCS_NAV } from "./docsNav";

export const metadata: Metadata = {
  title: "API documentation   SapAi",
  description: "SapAi standalone Fastify API and Next.js route handlers.",
};

export default function DocsApiHubPage() {
  const groups = API_DOCS_NAV.filter((g) => g.group !== "Overview");

  return (
    <div className="space-y-12">
      <DocsPageHeader
        title="API documentation"
        description="Reference for the standalone Fastify API. Configure your base URL and API key once, then try endpoints with Run request on each page."
      >
        <DocsCallout variant="info" title="Suggested path">
          <ol className="list-inside list-decimal space-y-1.5">
            <li>
              <Link href="/docs/api/server/test" className="font-medium underline underline-offset-2 hover:text-sky-900">
                Test API key
              </Link>{" "}
                validate connectivity
            </li>
            <li>
              <Link href="/docs/api/server/models" className="font-medium underline underline-offset-2 hover:text-sky-900">
                Chat models
              </Link>{" "}
                list allowed model ids
            </li>
            <li>
              <Link href="/docs/api/server/chat" className="font-medium underline underline-offset-2 hover:text-sky-900">
                Chat jobs
              </Link>{" "}
                send and poll
            </li>
            <li>
              <Link href="/docs/api/guides/embed" className="font-medium underline underline-offset-2 hover:text-sky-900">
                Embed widget
              </Link>{" "}
                dashboard setup guide
            </li>
          </ol>
        </DocsCallout>
      </DocsPageHeader>

      {groups.map((group) => (
        <section key={group.group} className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">{group.group}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow"
              >
                <h3 className="font-semibold text-zinc-900">{item.label}</h3>
                {item.summary ? (
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">{item.summary}</p>
                ) : null}
              </Link>
            ))}
          </div>
        </section>
      ))}

      <p className="border-t border-zinc-200 pt-8 text-center text-sm text-zinc-500">
        <Link href="/dashboard" className="font-medium text-zinc-800 hover:underline">
          Dashboard
        </Link>
        {" · "}
        <Link href="/login" className="font-medium text-zinc-800 hover:underline">
          Login
        </Link>
      </p>
    </div>
  );
}
