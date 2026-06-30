import { joinServerApiPath } from "./server-api";

const HEX_EMBED = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

export function resolveEmbedAccent(embedColor: string | null | undefined): string {
  const t = embedColor?.trim() ?? "";
  return t && HEX_EMBED.test(t) ? t : "#18181b";
}

export async function fetchEmbedAccent(token: string): Promise<string> {
  try {
    const res = await fetch(
      `${joinServerApiPath("/api/v1/embed/status")}?token=${encodeURIComponent(token)}`,
      { cache: "no-store" },
    );
    if (!res.ok) return "#18181b";
    const j = (await res.json()) as Record<string, unknown>;
    const data =
      j?.success === true && j.data && typeof j.data === "object"
        ? (j.data as Record<string, unknown>)
        : j;
    return resolveEmbedAccent(typeof data?.embedColor === "string" ? data.embedColor : null);
  } catch {
    return "#18181b";
  }
}
