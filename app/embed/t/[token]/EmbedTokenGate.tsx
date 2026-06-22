"use client";

import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

import {
  EmbedRagChat,
  type EmbedFurtherInfoLink,
  type EmbedPublicAppBadge,
  type EmbedPublicBranding,
} from "./EmbedRagChat";

import styles from "./EmbedRagChat.module.css";

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

function EmbedLoadingShell() {
  return (
    <div className="flex h-full min-h-0 w-full flex-col p-2 sm:p-3">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-lg">
        <div className="h-[3px] animate-pulse bg-zinc-200" />
        <div className="flex items-center gap-3 border-b border-zinc-100 px-3 py-3">
          <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-zinc-200" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3.5 w-28 animate-pulse rounded-md bg-zinc-200" />
            <div className="h-2.5 w-20 animate-pulse rounded-md bg-zinc-100" />
          </div>
        </div>
        <div className={cn("flex flex-1 flex-col justify-end gap-3 p-3", styles.scrollSleek)}>
          <div className="h-14 w-[78%] animate-pulse rounded-2xl rounded-bl-md bg-white shadow-sm ring-1 ring-zinc-100" />
          <div className="ml-auto h-10 w-[52%] animate-pulse rounded-2xl rounded-br-md bg-zinc-300/70" />
        </div>
        <div className="border-t border-zinc-100 p-3">
          <div className="h-11 animate-pulse rounded-xl bg-zinc-100" />
        </div>
      </div>
    </div>
  );
}

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
          const data =
            j?.success === true && j.data && typeof j.data === "object"
              ? (j.data as Record<string, unknown>)
              : j;
          setBranding({
            assistantName: nilStr(data?.assistantName),
            assistantDescription: nilStr(data?.assistantDescription),
            assistantGreeting: nilStr(data?.assistantGreeting),
            embedColor: nilStr(data?.embedColor),
            assistantProfileUrl: nilStr(data?.assistantProfileUrl),
            aiDisclaimer: nilStr(data?.aiDisclaimer),
            furtherInfoLink: parseFurtherInfoLink(data?.furtherInfoLink),
            appBadge: parseAppBadge(data?.appBadge),
          });
          const active = data?.active === true || (j?.ok === true && j?.active === true);
          setStatus(active ? "active" : "inactive");
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
    return <EmbedLoadingShell />;
  }

  return <EmbedRagChat token={token} embedActive={status === "active"} branding={branding} />;
}
