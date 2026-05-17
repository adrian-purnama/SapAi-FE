/** RAG analytics summary shape from `GET .../rag-analytics/summary` (subset for export). */
export type RagInsightsExportSummary = {
  window: { from: string | null; to: string | null };
  totalRagJobs: number;
  totalWithClassification: number;
  byAnswerable: Record<string, number>;
  byIntent: Record<string, number>;
  topCategories: { category: string; count: number }[];
  weakAnswers: {
    fingerprint: string | null;
    sampleQuestion: string;
    count: number;
    lastAt: string | null;
    sampleJobId?: string | null;
  }[];
};

export type RagInsightsExportMeta = {
  projectLabel: string;
  apiKeyId: string;
  plan: string;
  filterFrom: string;
  filterTo: string;
  filterAnswerable: string;
  filterIntent: string;
  filterCategory: string;
  exportedAtIso: string;
};

function escapeCsvCell(value: string): string {
  if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function csvLine(cells: string[]): string {
  return `${cells.map(escapeCsvCell).join(",")}\r\n`;
}

function formatWindow(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toISOString();
}

export function buildRagInsightsCsv(summary: RagInsightsExportSummary, meta: RagInsightsExportMeta): string {
  const lines: string[] = [];
  lines.push(csvLine(["SapAi RAG analytics export"]));
  lines.push(csvLine([]));
  lines.push(csvLine(["Project label", meta.projectLabel]));
  lines.push(csvLine(["API key id", meta.apiKeyId]));
  lines.push(csvLine(["Plan", meta.plan]));
  lines.push(csvLine(["Exported at (UTC)", meta.exportedAtIso]));
  lines.push(csvLine(["Filter from (date)", meta.filterFrom || "(none)"]));
  lines.push(csvLine(["Filter to (date)", meta.filterTo || "(none)"]));
  lines.push(csvLine(["Filter answerable", meta.filterAnswerable || "(none)"]));
  lines.push(csvLine(["Filter intent", meta.filterIntent || "(none)"]));
  lines.push(csvLine(["Filter category", meta.filterCategory || "(none)"]));
  lines.push(csvLine([]));
  lines.push(csvLine(["Server window from", formatWindow(summary.window.from)]));
  lines.push(csvLine(["Server window to", formatWindow(summary.window.to)]));
  lines.push(csvLine([]));

  lines.push(csvLine(["SUMMARY"]));
  lines.push(csvLine(["Metric", "Value"]));
  lines.push(csvLine(["totalRagJobs", String(summary.totalRagJobs)]));
  lines.push(csvLine(["totalWithClassification", String(summary.totalWithClassification)]));
  lines.push(csvLine([]));

  lines.push(csvLine(["ANSWERABLE"]));
  lines.push(csvLine(["key", "count"]));
  for (const [key, count] of Object.entries(summary.byAnswerable).sort((a, b) => b[1] - a[1])) {
    lines.push(csvLine([key, String(count)]));
  }
  lines.push(csvLine([]));

  lines.push(csvLine(["INTENT"]));
  lines.push(csvLine(["key", "count"]));
  for (const [key, count] of Object.entries(summary.byIntent).sort((a, b) => b[1] - a[1])) {
    lines.push(csvLine([key, String(count)]));
  }
  lines.push(csvLine([]));

  lines.push(csvLine(["TOP_CATEGORIES"]));
  lines.push(csvLine(["category", "count"]));
  for (const c of summary.topCategories) {
    lines.push(csvLine([c.category, String(c.count)]));
  }
  lines.push(csvLine([]));

  lines.push(csvLine(["WEAK_ANSWERS"]));
  lines.push(csvLine(["sampleQuestion", "count", "fingerprint", "lastAt"]));
  for (const w of summary.weakAnswers) {
    lines.push(
      csvLine([
        w.sampleQuestion,
        String(w.count),
        w.fingerprint ?? "",
        w.lastAt ? formatWindow(w.lastAt) : "",
      ]),
    );
  }

  return lines.join("");
}

const UTF8_BOM = "\ufeff";

export function downloadRagInsightsCsvForExcel(summary: RagInsightsExportSummary, meta: RagInsightsExportMeta): void {
  const body = UTF8_BOM + buildRagInsightsCsv(summary, meta);
  const safeLabel = meta.projectLabel.replace(/[^\w\-]+/g, "_").slice(0, 48) || "project";
  const day = meta.exportedAtIso.slice(0, 10).replace(/-/g, "");
  const filename = `rag-insights_${safeLabel}_${day}.csv`;

  const blob = new Blob([body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
