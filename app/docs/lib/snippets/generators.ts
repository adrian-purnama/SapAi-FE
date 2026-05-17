import { bashDoubleQuoted, bashSingleQuotedJson } from "./escape";

/** Canonical resolved HTTP example — one shape for every language generator. */
export type SnippetRequest = {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: unknown;
};

function headersSorted(headers: Record<string, string>): [string, string][] {
  return Object.entries(headers).sort(([a], [b]) => a.localeCompare(b));
}

export function buildCurlSnippet(req: SnippetRequest): string {
  const parts: string[] = [];
  const upper = req.method.toUpperCase();
  const hasJsonBody =
    req.body !== undefined &&
    req.body !== null &&
    upper !== "GET" &&
    upper !== "HEAD";

  if (hasJsonBody) {
    const json = JSON.stringify(req.body);
    const hs = headersSorted(req.headers);
    parts.push(`curl -sS -X ${upper} ${bashDoubleQuoted(req.url)} \\`);
    for (const [k, v] of hs) {
      parts.push(`  -H ${bashDoubleQuoted(`${k}: ${v}`)} \\`);
    }
    parts.push(`  --data-raw ${bashSingleQuotedJson(json)}`);
    return parts.join("\n");
  }

  const hs = headersSorted(req.headers);
  const useVerb = upper !== "GET" && upper !== "HEAD";
  const start = useVerb
    ? `curl -sS -X ${upper} ${bashDoubleQuoted(req.url)}`
    : `curl -sS ${bashDoubleQuoted(req.url)}`;

  if (hs.length === 0) {
    return start;
  }
  parts.push(`${start} \\`);
  hs.forEach(([k, v], i) => {
    const last = i === hs.length - 1;
    parts.push(`  -H ${bashDoubleQuoted(`${k}: ${v}`)}${last ? "" : " \\"}`);
  });
  return parts.join("\n");
}

function jsHeaderBlock(headers: Record<string, string>): string {
  const lines = headersSorted(headers)
    .map(([k, v]) => `    ${bashDoubleQuoted(k)}: ${bashDoubleQuoted(v)},`)
    .join("\n");
  return lines ? `  headers: {\n${lines}\n  },` : "";
}

export function buildJavaScriptSnippet(req: SnippetRequest): string {
  const upper = req.method.toUpperCase();
  const hasJsonBody =
    req.body !== undefined &&
    req.body !== null &&
    upper !== "GET" &&
    upper !== "HEAD";

  const urlLine = `const url = ${bashDoubleQuoted(req.url)};`;
  const hdr = jsHeaderBlock(req.headers);

  if (hasJsonBody) {
    const bodyPretty = JSON.stringify(req.body, null, 2);
    return `${urlLine}

const body = ${bodyPretty};

const res = await fetch(url, {
  method: ${bashDoubleQuoted(upper)},
${hdr ? `${hdr}\n` : ""}  body: JSON.stringify(body),
});

const data = await res.json();
console.log(data);`;
  }

  const useMethod = upper !== "GET";
  if (useMethod || hdr) {
    const methodLine = useMethod ? `  method: ${bashDoubleQuoted(upper)},\n` : "";
    return `${urlLine}

const res = await fetch(url, {
${methodLine}${hdr}
});

const data = await res.json();
console.log(data);`;
  }

  return `${urlLine}

const res = await fetch(url);
const data = await res.json();
console.log(data);`;
}

function pythonRequestFn(method: string): string {
  const m = method.toUpperCase();
  const map: Record<string, string> = {
    GET: "get",
    POST: "post",
    PUT: "put",
    PATCH: "patch",
    DELETE: "delete",
    HEAD: "head",
  };
  return map[m] ?? method.toLowerCase();
}

export function buildPythonSnippet(req: SnippetRequest): string {
  const upper = req.method.toUpperCase();
  const fn = pythonRequestFn(upper);
  const hasJsonBody =
    req.body !== undefined &&
    req.body !== null &&
    upper !== "GET" &&
    upper !== "HEAD";

  const urlPy = bashDoubleQuoted(req.url);

  const headerEntries = headersSorted(req.headers)
    .map(([k, v]) => `    ${bashDoubleQuoted(k)}: ${bashDoubleQuoted(v)},`)
    .join("\n");

  const headersBlock =
    headerEntries.length > 0
      ? `headers = {
${headerEntries}
}
`
      : "";

  if (hasJsonBody && req.body !== undefined) {
    const compact = JSON.stringify(req.body);
    const hdrArg = headerEntries.length > 0 ? ", headers=headers" : "";
    return `import json
import requests

url = ${urlPy}
${headersBlock}payload = json.loads(${bashDoubleQuoted(compact)})

r = requests.${fn}(url${hdrArg}, json=payload)
r.raise_for_status()
print(r.json())`;
  }

  if (!headersBlock) {
    return `import requests

url = ${urlPy}

r = requests.${fn}(url)
r.raise_for_status()
print(r.json())`;
  }

  return `import requests

url = ${urlPy}
${headersBlock}
r = requests.${fn}(url, headers=headers)
r.raise_for_status()
print(r.json())`;
}

/** Ordered language blocks for the docs UI. */
export const SNIPPET_LANGUAGES = [
  { id: "curl", title: "curl", build: buildCurlSnippet },
  { id: "javascript", title: "JavaScript (fetch)", build: buildJavaScriptSnippet },
  { id: "python", title: "Python (requests)", build: buildPythonSnippet },
] as const;
