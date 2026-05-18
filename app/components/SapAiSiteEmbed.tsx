"use client";

import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { EMBED_IFRAME_H, EMBED_IFRAME_INLINE_STYLE, EMBED_IFRAME_W } from "@/lib/embed-iframe";
import { isSapAiEmbedMessage } from "@/lib/embed-post-message";

type Props = {
  src: string;
};

/**
 * Site-wide SapAi iframe widget (e.g. root layout). Hidden on `/embed/*` and when the user closes the panel.
 */
export function SapAiSiteEmbed({ src }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);

  const onMessage = useCallback((event: MessageEvent) => {
    if (!isSapAiEmbedMessage(event.data)) return;
    if (event.data.action === "close") setOpen(false);
    if (event.data.action === "open") setOpen(true);
  }, []);

  useEffect(() => {
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onMessage]);

  if (pathname?.startsWith("/embed")) {
    return null;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-[2147483000] inline-flex h-14 w-14 items-center justify-center rounded-full border border-zinc-200/90 bg-zinc-900 text-white shadow-lg transition hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
        aria-label="Open assistant chat"
      >
        <MessageCircle className="h-6 w-6" aria-hidden />
      </button>
    );
  }

  return (
    <iframe
      id="sapai-embed-widget"
      src={src}
      title="SapAi assistant"
      width={EMBED_IFRAME_W}
      height={EMBED_IFRAME_H}
      style={EMBED_IFRAME_INLINE_STYLE}
      allow="clipboard-write"
    />
  );
}
