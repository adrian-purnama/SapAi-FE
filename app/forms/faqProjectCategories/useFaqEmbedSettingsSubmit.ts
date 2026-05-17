"use client";

import { useCallback, useState } from "react";

import { toastError, toastSuccess } from "@/lib/app-toast";
import { getAuthSession } from "@/lib/auth-client";
import { joinServerApiPath } from "@/lib/server-api";

import type {
  EmbedAppBadgePolicy,
  FaqEmbedFurtherInfoLink,
  FaqEmbedPublicFlags,
} from "./useFaqProjectCategoriesData";

function bearerAuthHeaders(): HeadersInit | undefined {
  const t = getAuthSession()?.token;
  return t ? { Authorization: `Bearer ${t}` } : undefined;
}

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

function parseEmbedAppBadgePolicy(raw: unknown): EmbedAppBadgePolicy {
  if (raw === "required" || raw === "customizable" || raw === "none") return raw;
  return "none";
}

function parseEmbedFromPayload(raw: unknown): FaqEmbedPublicFlags {
  if (!raw || typeof raw !== "object") {
    return {
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

export type PatchEmbedBody = { enabled?: boolean; rotate?: boolean; allowedOrigins?: string[] };

export type PatchEmbedUiBody = {
  assistantName?: string | null;
  assistantDescription?: string | null;
  assistantGreeting?: string | null;
  embedColor?: string | null;
  aiDisclaimer?: string | null;
  furtherInfoLink?: { label: string | null; url: string | null } | null;
  appBadge?: { enabled: boolean; label: string | null } | null;
  clearAssistantAvatar?: boolean;
};

export function useFaqEmbedSettingsSubmit(apiKeyId: string) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const patchEmbed = useCallback(
    async (
      body: PatchEmbedBody,
    ): Promise<{ ok: true; embed: FaqEmbedPublicFlags } | { ok: false; error: string }> => {
      if (!apiKeyId) {
        const err = "Missing project.";
        toastError(err, { id: "faq-embed" });
        return { ok: false, error: err };
      }
      const auth = bearerAuthHeaders();
      if (!auth) {
        const err = "Not signed in.";
        toastError(err, { id: "faq-embed" });
        return { ok: false, error: err };
      }
      setSaving(true);
      setError("");
      try {
        const res = await fetch(
          joinServerApiPath(`/api/v1/api-keys/${encodeURIComponent(apiKeyId)}/faq-constants/embed`),
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json", ...auth },
            body: JSON.stringify(body),
          },
        );
        const payload = await res.json();
        if (!res.ok || !payload?.success) {
          throw new Error(payload?.error?.message ?? "Failed to update embed settings.");
        }
        const embed = parseEmbedFromPayload(payload.data?.embed);
        if (body.rotate) toastSuccess("Embed token rotated.", { id: "faq-embed-ok" });
        else if (body.allowedOrigins !== undefined) {
          toastSuccess("Allowed origins saved.", { id: "faq-embed-ok" });
        } else if (body.enabled !== undefined) {
          toastSuccess(body.enabled ? "Embed enabled." : "Embed disabled.", { id: "faq-embed-ok" });
        }
        return { ok: true as const, embed };
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Update failed.";
        setError(msg);
        toastError(msg, { id: "faq-embed-api" });
        return { ok: false as const, error: msg };
      } finally {
        setSaving(false);
      }
    },
    [apiKeyId],
  );

  const patchEmbedUi = useCallback(
    async (
      body: PatchEmbedUiBody,
    ): Promise<{ ok: true; embed: FaqEmbedPublicFlags } | { ok: false; error: string }> => {
      if (!apiKeyId) {
        const err = "Missing project.";
        toastError(err, { id: "faq-embed" });
        return { ok: false, error: err };
      }
      const auth = bearerAuthHeaders();
      if (!auth) {
        const err = "Not signed in.";
        toastError(err, { id: "faq-embed" });
        return { ok: false, error: err };
      }
      setSaving(true);
      setError("");
      try {
        const res = await fetch(
          joinServerApiPath(`/api/v1/api-keys/${encodeURIComponent(apiKeyId)}/faq-constants/embed/ui`),
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json", ...auth },
            body: JSON.stringify(body),
          },
        );
        const payload = await res.json();
        if (!res.ok || !payload?.success) {
          throw new Error(payload?.error?.message ?? "Failed to update embed appearance.");
        }
        const embed = parseEmbedFromPayload(payload.data?.embed);
        toastSuccess("Appearance saved.", { id: "faq-embed-ok" });
        return { ok: true as const, embed };
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Update failed.";
        setError(msg);
        toastError(msg, { id: "faq-embed-api" });
        return { ok: false as const, error: msg };
      } finally {
        setSaving(false);
      }
    },
    [apiKeyId],
  );

  const uploadAssistantAvatar = useCallback(
    async (file: File): Promise<{ ok: true; embed: FaqEmbedPublicFlags } | { ok: false; error: string }> => {
      if (!apiKeyId) {
        const err = "Missing project.";
        toastError(err, { id: "faq-embed" });
        return { ok: false, error: err };
      }
      const auth = bearerAuthHeaders();
      if (!auth) {
        const err = "Not signed in.";
        toastError(err, { id: "faq-embed" });
        return { ok: false, error: err };
      }
      setSaving(true);
      setError("");
      try {
        const fd = new FormData();
        fd.append("assistantAvatar", file);
        const res = await fetch(
          joinServerApiPath(`/api/v1/api-keys/${encodeURIComponent(apiKeyId)}/faq-constants/embed/assistant-picture`),
          { method: "PATCH", headers: auth, body: fd },
        );
        const payload = await res.json();
        if (!res.ok || !payload?.success) {
          throw new Error(payload?.error?.message ?? "Failed to upload assistant picture.");
        }
        const embed = parseEmbedFromPayload(payload.data?.embed);
        toastSuccess("Assistant picture updated.", { id: "faq-embed-ok" });
        return { ok: true as const, embed };
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Upload failed.";
        setError(msg);
        toastError(msg, { id: "faq-embed-api" });
        return { ok: false as const, error: msg };
      } finally {
        setSaving(false);
      }
    },
    [apiKeyId],
  );

  return { patchEmbed, patchEmbedUi, uploadAssistantAvatar, saving, error, clearError: () => setError("") };
}
