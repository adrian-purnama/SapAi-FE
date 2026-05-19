export const SAPAI_EMBED_MESSAGE_TYPE = "sapai-embed" as const;

export type SapAiEmbedMessageAction = "close" | "open";

export type SapAiEmbedMessage = {
  type: typeof SAPAI_EMBED_MESSAGE_TYPE;
  action: SapAiEmbedMessageAction;
};

export const EMBED_WIDGET_QUERY = "widget";
export const EMBED_WIDGET_QUERY_VALUE = "1";

/** True when this document runs inside any parent iframe. */
export function isInEmbedIframe(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.parent !== window;
  } catch {
    return true;
  }
}

/**
 * Floating site widget / pasted snippet: parent hides the iframe on close via postMessage.
 * Dashboard live preview omits `?widget=1` and collapses inside the iframe instead.
 */
export function isHostWidgetEmbed(): boolean {
  if (!isInEmbedIframe()) return false;
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get(EMBED_WIDGET_QUERY) === EMBED_WIDGET_QUERY_VALUE;
}

/** Dashboard settings inline preview (same-origin); close collapses inside the iframe. */
export function isEmbedLivePreview(): boolean {
  if (!isInEmbedIframe() || isHostWidgetEmbed()) return false;
  try {
    const path = window.parent.location.pathname;
    return path.includes("/dashboard") || path.includes("/projects/");
  } catch {
    return false;
  }
}

/** Parent hides iframe on close; do not collapse in-frame (avoids double-open on reopen). */
export function isParentControlledEmbedClose(): boolean {
  return isInEmbedIframe() && !isEmbedLivePreview();
}

/** Append `widget=1` to embed iframe `src` for host-controlled close behavior. */
export function withEmbedWidgetParam(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  try {
    const base =
      typeof window !== "undefined" ? window.location.origin : "https://localhost";
    const u = new URL(trimmed, base);
    if (u.searchParams.get(EMBED_WIDGET_QUERY) === EMBED_WIDGET_QUERY_VALUE) {
      return trimmed;
    }
    u.searchParams.set(EMBED_WIDGET_QUERY, EMBED_WIDGET_QUERY_VALUE);
    if (/^https?:\/\//i.test(trimmed)) return u.toString();
    return `${u.pathname}${u.search}${u.hash}`;
  } catch {
    const sep = trimmed.includes("?") ? "&" : "?";
    return `${trimmed}${sep}${EMBED_WIDGET_QUERY}=${EMBED_WIDGET_QUERY_VALUE}`;
  }
}

export function postSapAiEmbedMessage(action: SapAiEmbedMessageAction): void {
  if (typeof window === "undefined") return;
  const msg: SapAiEmbedMessage = { type: SAPAI_EMBED_MESSAGE_TYPE, action };
  if (isInEmbedIframe()) {
    window.parent.postMessage(msg, "*");
  }
}

export function isSapAiEmbedMessage(data: unknown): data is SapAiEmbedMessage {
  if (!data || typeof data !== "object") return false;
  const o = data as Record<string, unknown>;
  return (
    o.type === SAPAI_EMBED_MESSAGE_TYPE && (o.action === "close" || o.action === "open")
  );
}

/** Listener script for host pages that paste the iframe snippet (hides/shows the iframe). */
export function buildEmbedHostListenerScript(iframeId = "sapai-embed-widget"): string {
  return `<script>
(function () {
  var iframe = document.getElementById(${JSON.stringify(iframeId)});
  if (!iframe) return;
  window.addEventListener("message", function (e) {
    var d = e.data;
    if (!d || d.type !== ${JSON.stringify(SAPAI_EMBED_MESSAGE_TYPE)}) return;
    if (d.action === "close") iframe.style.display = "none";
    if (d.action === "open") iframe.style.display = "";
  });
})();
</script>`;
}
