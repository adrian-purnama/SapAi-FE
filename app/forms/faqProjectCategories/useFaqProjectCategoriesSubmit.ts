"use client";

import { useCallback, useState } from "react";

import { toastError, toastSuccess } from "@/lib/app-toast";
import { getAuthSession } from "@/lib/auth-client";
import { joinServerApiPath } from "@/lib/server-api";

function bearerAuthHeaders(): HeadersInit | undefined {
  const t = getAuthSession()?.token;
  return t ? { Authorization: `Bearer ${t}` } : undefined;
}

export function useFaqProjectCategoriesSubmit(apiKeyId: string) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const saveCategories = useCallback(
    async (categories: string[]) => {
      if (!apiKeyId) {
        const err = "Missing project.";
        toastError(err, { id: "faq-categories-err" });
        return { ok: false as const, error: err };
      }
      const auth = bearerAuthHeaders();
      if (!auth) {
        const err = "Not signed in.";
        toastError(err, { id: "faq-categories-err" });
        return { ok: false as const, error: err };
      }
      setSaving(true);
      setError("");
      try {
        const res = await fetch(
          joinServerApiPath(`/api/v1/api-keys/${encodeURIComponent(apiKeyId)}/faq-constants`),
          {
            method: "PUT",
            headers: { "Content-Type": "application/json", ...auth },
            body: JSON.stringify({ categories }),
          },
        );
        const payload = await res.json();
        if (!res.ok || !payload?.success) {
          throw new Error(payload?.error?.message ?? "Failed to save categories.");
        }
        const raw = payload.data?.categories;
        const next = Array.isArray(raw) ? raw.map((c: unknown) => String(c)) : [];
        toastSuccess("Categories saved.", { id: "faq-categories-ok" });
        return { ok: true as const, categories: next };
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Save failed.";
        setError(msg);
        toastError(msg, { id: "faq-categories-err" });
        return { ok: false as const, error: msg };
      } finally {
        setSaving(false);
      }
    },
    [apiKeyId],
  );

  return { saveCategories, saving, error, clearError: () => setError("") };
}
