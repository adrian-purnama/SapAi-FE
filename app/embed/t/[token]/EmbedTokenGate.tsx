"use client";

import { useEffect, useMemo, useState } from "react";

import {
  EmbedRagChat,
  type EmbedFurtherInfoLink,
  type EmbedPublicAppBadge,
  type EmbedPublicBranding,
} from "./EmbedRagChat";

function readStandaloneBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_STANDALONE_API_URL?.trim() || "http://localhost:8000";
  return raw.replace(/\/$/, "");
}

function nilStr(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

function parseFurtherInfoLink(raw: unknown): EmbedFurtherInfoLink | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const label = nilStr(o.label);
  const url = nilStr(o.url);
  return label && url ? { label, url } : null;
}

function parseAppBadge(raw: unknown): EmbedPublicAppBadge | null {
  if (!raw || typeof raw !== "object") return null;
  const label = nilStr((raw as Record<string, unknown>).label);
  return label ? { label } : null;
}

type Props = {
  token: string;
};

export function EmbedTokenGate({ token }: Props) {
  const baseUrl = useMemo(() => readStandaloneBaseUrl(), []);
  const [status, setStatus] = useState<"loading" | "active" | "inactive">("loading");
  const [branding, setBranding] = useState<EmbedPublicBranding | null>(null);

  useEffect(() => {
    const t = token.trim();
    if (!t) {
      setStatus("inactive");
      setBranding(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`${baseUrl}/api/v1/embed/status?token=${encodeURIComponent(t)}`);
        if (cancelled) return;
        if (res.ok) {
          const j = (await res.json().catch(() => null)) as Record<string, unknown> | null;
          setBranding({
            assistantName: nilStr(j?.assistantName),
            assistantDescription: nilStr(j?.assistantDescription),
            assistantGreeting: nilStr(j?.assistantGreeting),
            embedColor: nilStr(j?.embedColor),
            assistantProfileUrl: nilStr(j?.assistantProfileUrl),
            aiDisclaimer: nilStr(j?.aiDisclaimer),
            furtherInfoLink: parseFurtherInfoLink(j?.furtherInfoLink),
            appBadge: parseAppBadge(j?.appBadge),
          });
          setStatus(j?.ok === true && j?.active === true ? "active" : "inactive");
        } else {
          setBranding(null);
          setStatus("inactive");
        }
      } catch {
        if (!cancelled) {
          setBranding(null);
          setStatus("inactive");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [baseUrl, token]);

  if (status === "loading") {
    return (
      <div className="flex h-full min-h-0 items-center justify-center bg-zinc-100 p-6 text-sm text-zinc-600">
        Checking embed…
      </div>
    );
  }

  return <EmbedRagChat token={token} embedActive={status === "active"} branding={branding} />;
}
