"use client";

import { useCallback, useEffect, useState } from "react";

import { getAuthSession } from "@/lib/auth-client";
import { joinServerApiPath } from "@/lib/server-api";

function bearerAuthHeaders(): HeadersInit | undefined {
  const t = getAuthSession()?.token;
  return t ? { Authorization: `Bearer ${t}` } : undefined;
}

export type FaqEmbedFurtherInfoLink = { label: string; url: string };
export type EmbedAppBadgePolicy = "none" | "required" | "customizable";

export type FaqEmbedPublicFlags = {
  enabled: boolean;
  hasToken: boolean;
  /** True when the signed-in account plan allows public embed (Pro / Scale). */
  embedPlanEligible: boolean;
  /** Third-party parent origins for iframe CSP (empty = only same app can frame). */
  allowedOrigins: string[];
  /** Plaintext embed token (authenticated owner APIs only). */
  token: string | null;
  assistantName: string | null;
  assistantDescription: string | null;
  assistantGreeting: string | null;
  embedColor: string | null;
  assistantProfileUrl: string | null;
  /** Custom disclaimer; null = default copy in the public widget. */
  aiDisclaimer: string | null;
  furtherInfoLink: FaqEmbedFurtherInfoLink | null;
  embedAppBadgePolicy: EmbedAppBadgePolicy;
  appBadgeEnabled: boolean | null;
  appBadgeLabel: string | null;
  aiDisclaimerEditable: boolean;
};

export type FaqProjectCategoriesLoadState = {
  categories: string[];
  embed: FaqEmbedPublicFlags;
  loading: boolean;
  error: string;
  refetch: () => Promise<void>;
};

function nilStr(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

function parseFurtherInfoLink(raw: unknown): FaqEmbedFurtherInfoLink | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const label = nilStr(o.label);
  const url = nilStr(o.url);
  return label && url ? { label, url } : null;
}

const EMPTY_EMBED: FaqEmbedPublicFlags = {
  enabled: false,
  hasToken: false,
  embedPlanEligible: true,
  allowedOrigins: [],
  token: null,
  assistantName: null,
  assistantDescription: null,
  assistantGreeting: null,
  embedColor: null,
  assistantProfileUrl: null,
  aiDisclaimer: null,
  furtherInfoLink: null,
  embedAppBadgePolicy: "none",
  appBadgeEnabled: null,
  appBadgeLabel: null,
  aiDisclaimerEditable: false,
};

function parseEmbedAppBadgePolicy(raw: unknown): EmbedAppBadgePolicy {
  if (raw === "required" || raw === "customizable" || raw === "none") return raw;
  return "none";
}

function parseEmbedPayload(raw: unknown): FaqEmbedPublicFlags {
  if (!raw || typeof raw !== "object") {
    return { ...EMPTY_EMBED };
  }
  const o = raw as Record<string, unknown>;
  const enabled = typeof o.embedEnabled === "boolean" ? o.embedEnabled : Boolean(o.enabled);
  const ar = o.allowedOrigins;
  const allowedOrigins = Array.isArray(ar) ? ar.map((x) => String(x)) : [];
  const tokenRaw = typeof o.token === "string" ? o.token.trim() : "";
  const token = tokenRaw.length > 0 ? tokenRaw : null;
  const hasToken = Boolean(typeof o.hasToken === "boolean" ? o.hasToken : token);
  const embedPlanEligible =
    typeof o.embedPlanEligible === "boolean" ? o.embedPlanEligible : true;
  return {
    enabled,
    hasToken,
    embedPlanEligible,
    allowedOrigins,
    token,
    assistantName: nilStr(o.assistantName),
    assistantDescription: nilStr(o.assistantDescription),
    assistantGreeting: nilStr(o.assistantGreeting),
    embedColor: nilStr(o.embedColor),
    assistantProfileUrl: nilStr(o.assistantProfileUrl),
    aiDisclaimer: nilStr(o.aiDisclaimer),
    furtherInfoLink: parseFurtherInfoLink(o.furtherInfoLink),
    embedAppBadgePolicy: parseEmbedAppBadgePolicy(o.embedAppBadgePolicy),
    appBadgeEnabled: typeof o.appBadgeEnabled === "boolean" ? o.appBadgeEnabled : null,
    appBadgeLabel: nilStr(o.appBadgeLabel),
    aiDisclaimerEditable: Boolean(o.aiDisclaimerEditable),
  };
}

export function useFaqProjectCategoriesData(apiKeyId: string) {
  const [categories, setCategories] = useState<string[]>([]);
  const [embed, setEmbed] = useState<FaqEmbedPublicFlags>({ ...EMPTY_EMBED });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refetch = useCallback(async () => {
    if (!apiKeyId) {
      setCategories([]);
      setEmbed({ ...EMPTY_EMBED });
      setLoading(false);
      setError("");
      return;
    }
    const auth = bearerAuthHeaders();
    if (!auth) {
      setCategories([]);
      setEmbed({ ...EMPTY_EMBED });
      setLoading(false);
      setError("");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        joinServerApiPath(`/api/v1/api-keys/${encodeURIComponent(apiKeyId)}/faq-constants`),
        { method: "GET", headers: auth },
      );
      const payload = await res.json();
      if (!res.ok || !payload?.success) {
        throw new Error(payload?.error?.message ?? "Failed to load categories.");
      }
      const raw = payload.data?.categories;
      setCategories(Array.isArray(raw) ? raw.map((c: unknown) => String(c)) : []);
      setEmbed(parseEmbedPayload(payload.data?.embed));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load categories.");
      setCategories([]);
      setEmbed({ ...EMPTY_EMBED });
    } finally {
      setLoading(false);
    }
  }, [apiKeyId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { categories, embed, loading, error, refetch };
}
