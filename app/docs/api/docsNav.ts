/**
 * Single source for `/docs/api` sidebar links and hub cards.
 *
 * To add a documented API area:
 * 1. Add `{ href, label }` under the right group below.
 * 2. Create `app/app/docs/api/.../page.tsx` with metadata + content.
 * 3. Wrap each endpoint in `ApiEndpointSection` (Try it → example payloads → reference).
 * 4. Use `ApiHttpExamplesPanel` inside `tryIt` for Run request + code samples.
 */

export type DocsNavItem = { href: string; label: string; summary?: string };
export type DocsNavGroup = { group: string; items: DocsNavItem[] };

export const API_DOCS_NAV: DocsNavGroup[] = [
  {
    group: "Overview",
    items: [{ href: "/docs/api", label: "Overview" }],
  },
  {
    group: "Guides",
    items: [
      {
        href: "/docs/api/guides/embed",
        label: "Chat Embed Guide",
        summary:
          "Where to click: dashboard → project → RAG tab, knowledge, embed Setup / Widget look / Sites & copy, profile picture.",
      },
    ],
  },
  {
    group: "Standalone API",
    items: [
      {
        href: "/docs/api/server/test",
        label: "Test Api Key",
        summary: "GET /test/api-key for connectivity and API key check.",
      },
      {
        href: "/docs/api/server/models",
        label: "Chat models",
        summary: "GET /api/v1/chat/models — allowed model ids for jobs.",
      },
      {
        href: "/docs/api/server/chat",
        label: "Chat jobs",
        summary: "POST /api/v1/chat — enqueue a job; GET /api/v1/chat/jobs/:id — fetch status and result.",
      },
    ],
  },
];

/** Standalone + Next groups only — used on the API hub for card links. */
export function getApiDocsHubCardItems(): DocsNavItem[] {
  return API_DOCS_NAV.filter((g) => g.group !== "Overview").flatMap((g) => g.items);
}
