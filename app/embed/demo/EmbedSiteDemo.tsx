"use client";

import type { CSSProperties } from "react";
import { MessageCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { EMBED_IFRAME_H, EMBED_IFRAME_W } from "@/lib/embed-iframe";
import { isSapAiEmbedMessage, withEmbedWidgetParam } from "@/lib/embed-post-message";

const FAB_STYLE: CSSProperties = {
  position: "fixed",
  bottom: 20,
  right: 20,
  zIndex: 2147483001,
};

const WIDGET_STYLE: CSSProperties = {
  position: "fixed",
  bottom: 20,
  right: 20,
  border: 0,
  borderRadius: 16,
  background: "transparent",
  zIndex: 2147483000,
  boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
  width: `min(${EMBED_IFRAME_W}px, calc(100vw - 40px))`,
  height: `min(${EMBED_IFRAME_H}px, calc(100dvh - 40px))`,
  maxWidth: "calc(100vw - 40px)",
  maxHeight: "calc(100dvh - 40px)",
};

type Props = {
  siteUrl: string;
  token: string;
  accent: string;
};

export function EmbedSiteDemo({ siteUrl, token, accent }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [open, setOpen] = useState(false);
  const embedSrc = withEmbedWidgetParam(`/embed/t/${encodeURIComponent(token)}`);

  const onMessage = useCallback((event: MessageEvent) => {
    if (!isSapAiEmbedMessage(event.data)) return;
    const frameWindow = iframeRef.current?.contentWindow;
    if (frameWindow && event.source !== frameWindow) return;
    if (event.data.action === "close") setOpen(false);
    if (event.data.action === "open") setOpen(true);
  }, []);

  useEffect(() => {
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onMessage]);

  return (
    <div className="fixed inset-0 z-10 bg-white">
      <iframe title="Client website preview" src={siteUrl} className="h-full w-full border-0" />
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-14 w-14 items-center justify-center rounded-full border-0 text-white shadow-lg transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
          style={{ ...FAB_STYLE, backgroundColor: accent }}
          aria-label="Open assistant chat"
        >
          <MessageCircle className="h-6 w-6" aria-hidden />
        </button>
      ) : null}
      <iframe
        ref={iframeRef}
        title="SapAi assistant"
        src={embedSrc}
        style={{ ...WIDGET_STYLE, display: open ? "block" : "none" }}
        allow="clipboard-write"
      />
    </div>
  );
}
