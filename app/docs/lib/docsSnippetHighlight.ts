/** Shiki syntax highlighting for API docs (browser / client components only). */

const THEME = "dracula" as const;

export type SnippetTabId = "curl" | "javascript" | "python";

export async function highlightSnippetTab(code: string, tab: SnippetTabId): Promise<string> {
  const { codeToHtml } = await import("shiki");
  const lang = tab === "curl" ? "bash" : tab === "javascript" ? "javascript" : "python";
  return codeToHtml(code.trimEnd(), { lang, theme: THEME });
}

/** Pretty-print JSON when possible; otherwise shell-style plain text. */
export async function highlightRunResponse(raw: string): Promise<string> {
  const { codeToHtml } = await import("shiki");
  const t = raw.trim();
  try {
    const j = JSON.parse(t) as unknown;
    return codeToHtml(JSON.stringify(j, null, 2), { lang: "json", theme: THEME });
  } catch {
    return codeToHtml(raw, { lang: "bash", theme: THEME });
  }
}
