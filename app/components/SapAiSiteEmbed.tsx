"use client";

import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { EMBED_IFRAME_INLINE_STYLE } from "@/lib/embed-iframe";
import { isSapAiEmbedMessage, withEmbedWidgetParam } from "@/lib/embed-post-message";

const SITE_EMBED_OPEN_KEY = "sapai-site-embed-open";

type Props = {
  src: string;
};

function readDefaultSiteEmbedOpen(): boolean {
  const raw = process.env.NEXT_PUBLIC_SITE_EMBED_DEFAULT_OPEN?.trim().toLowerCase();
  if (raw === "true" || raw === "1") return true;
  if (raw === "false" || raw === "0") return false;
  return false;
}

function readStoredSiteEmbedOpen(): boolean {
  if (typeof window === "undefined") return readDefaultSiteEmbedOpen();
  try {
    const v = sessionStorage.getItem(SITE_EMBED_OPEN_KEY);
    if (v === "1") return true;
    if (v === "0") return false;
  } catch {
    /* private mode */
  }
  return readDefaultSiteEmbedOpen();
}

function storeSiteEmbedOpen(open: boolean): void {
  try {
    sessionStorage.setItem(SITE_EMBED_OPEN_KEY, open ? "1" : "0");
  } catch {
    /* ignore */
  }
}

/**
 * Site-wide SapAi iframe widget (e.g. root layout). Hidden on `/embed/*`.
 * Iframe stays mounted when closed so in-iframe chat state is preserved.
 */
const SITE_EMBED_FAB_STYLE = {
  bottom: EMBED_IFRAME_INLINE_STYLE.bottom ?? 20,
  right: EMBED_IFRAME_INLINE_STYLE.right ?? 20,
} as const;

export function SapAiSiteEmbed({ src }: Props) {
  const pathname = usePathname();
  const widgetSrc = withEmbedWidgetParam(src);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setOpen(readStoredSiteEmbedOpen());
    setHydrated(true);
  }, []);

  const setOpenPersisted = useCallback((next: boolean) => {
    setOpen(next);
    storeSiteEmbedOpen(next);
  }, []);

  const onMessage = useCallback(
    (event: MessageEvent) => {
      if (!isSapAiEmbedMessage(event.data)) return;
      const frameWindow = iframeRef.current?.contentWindow;
      if (frameWindow && event.source !== frameWindow) return;
      if (event.data.action === "close") setOpenPersisted(false);
      if (event.data.action === "open") setOpenPersisted(true);
    },
    [setOpenPersisted],
  );

  useEffect(() => {
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onMessage]);

  if (pathname?.startsWith("/embed")) {
    return null;
  }

  if (!hydrated) {
    return null;
  }

  return (
    <>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpenPersisted(true)}
          className="fixed z-[2147483000] inline-flex h-14 w-14 items-center justify-center rounded-full border border-zinc-200/90 bg-zinc-900 text-white shadow-lg transition hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
          style={SITE_EMBED_FAB_STYLE}
          aria-label="Open assistant chat"
        >
          <MessageCircle className="h-6 w-6" aria-hidden />
        </button>
      ) : null}
      <iframe
        ref={iframeRef}
        id="sapai-embed-widget"
        src={widgetSrc}
        title="SapAi assistant"
        style={{
          ...EMBED_IFRAME_INLINE_STYLE,
          display: open ? "block" : "none",
        }}
        allow="clipboard-write"
      />
    </>
  );
}
