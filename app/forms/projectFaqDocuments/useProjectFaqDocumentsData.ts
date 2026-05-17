"use client";

import { useCallback, useEffect, useState } from "react";
import { useSapAi } from "@/app/providers/sapai-provider";
import { toastError } from "@/lib/app-toast";
import { joinServerApiPath } from "@/lib/server-api";

import type { FaqProcessingStatus, ProjectFaqDocumentRow } from "./schema";
import { isFaqDocumentBusy } from "./schema";

export function useProjectFaqDocumentsData(apiKeyId: string) {
  const { token } = useSapAi();
  const [documents, setDocuments] = useState<ProjectFaqDocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!apiKeyId) {
      setDocuments([]);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        joinServerApiPath(`/api/v1/api-keys/${encodeURIComponent(apiKeyId)}/faq-documents`),
        { method: "GET", headers: token ? { Authorization: `Bearer ${token}` } : undefined },
      );
      const payload = await res.json();
      if (!res.ok || !payload?.success) {
        throw new Error(payload?.error?.message ?? "Failed to load documents.");
      }
      const raw = payload.data?.documents as ProjectFaqDocumentRow[] | undefined;
      setDocuments(
        Array.isArray(raw)
          ? raw.map((d) => ({
              ...d,
              chunk: {
                totalChunks: d.chunk?.totalChunks ?? 0,
                processedChunks: d.chunk?.processedChunks ?? 0,
              },
              isProcessed: Boolean(d.isProcessed),
              processingStatus: (d.processingStatus as FaqProcessingStatus) ?? "uploaded",
              processingError:
                d.processingError?.step && d.processingError?.message
                  ? { step: d.processingError.step, message: String(d.processingError.message) }
                  : null,
              processingUpdatedAt: d.processingUpdatedAt ?? null,
            }))
          : [],
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load documents.";
      setError(msg);
      toastError(msg, { id: "faq-docs-list" });
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [apiKeyId, token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const hasBusyDocuments = documents.some((d) => isFaqDocumentBusy(d.processingStatus));

  useEffect(() => {
    if (!hasBusyDocuments || !apiKeyId) return;
    const id = window.setInterval(() => {
      void load();
    }, 3000);
    return () => window.clearInterval(id);
  }, [hasBusyDocuments, apiKeyId, load]);

  return { documents, loading, error, refetch: load, hasBusyDocuments };
}
