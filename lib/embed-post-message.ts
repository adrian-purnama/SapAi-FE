export const SAPAI_EMBED_MESSAGE_TYPE = "sapai-embed" as const;

export type SapAiEmbedMessageAction = "close" | "open";

export type SapAiEmbedMessage = {
  type: typeof SAPAI_EMBED_MESSAGE_TYPE;
  action: SapAiEmbedMessageAction;
};

export function postSapAiEmbedMessage(action: SapAiEmbedMessageAction): void {
  if (typeof window === "undefined") return;
  const msg: SapAiEmbedMessage = { type: SAPAI_EMBED_MESSAGE_TYPE, action };
  if (window.parent !== window) {
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
