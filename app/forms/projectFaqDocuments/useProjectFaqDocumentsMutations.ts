"use client";

import { useCallback, useState } from "react";
import { useSapAi } from "@/app/providers/sapai-provider";
import { toastError, toastSuccess } from "@/lib/app-toast";
import { joinServerApiPath } from "@/lib/server-api";

type ApiPayload = {
  success?: boolean;
  error?: { message?: string; code?: string };
  data?: {
    processingStatus?: string;
    processingError?: { step?: string; message?: string };
  };
};

export function useProjectFaqDocumentsMutations(
  apiKeyId: string,
  onDone: () => void | Promise<void>,
  limits: { maxBytes: number },
) {
  const { token } = useSapAi();
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState("");

  const refresh = useCallback(async () => {
    await onDone();
  }, [onDone]);

  const upload = useCallback(
    async (file: File, projectApiKey: string) => {
      if (!apiKeyId) return;
      setMutationError("");
      void projectApiKey;
      if (file.size > limits.maxBytes) {
        const msg = `File too large. Maximum ${Math.round(limits.maxBytes / (1024 * 1024))} MB per file on your plan.`;
        setMutationError(msg);
        toastError(msg, { id: "faq-docs-mutation" });
        return;
      }
      setUploading(true);
      try {
        const body = new FormData();
        body.append("file", file);
        const q = new URLSearchParams({ apiKeyId });
        const res = await fetch(joinServerApiPath(`/api/v1/faq-documents?${q.toString()}`), {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          body,
        });
        const payload = (await res.json()) as ApiPayload;
        if (!res.ok || !payload?.success) {
          throw new Error(payload?.error?.message ?? "Upload failed.");
        }
        await refresh();
        setMutationError("");
        const failed = payload.data?.processingStatus === "failed";
        if (failed) {
          const errMsg = payload.data?.processingError?.message ?? "Processing failed after upload.";
          toastError(errMsg, { id: "faq-docs-mutation" });
        } else {
          toastSuccess("Document uploaded and indexed.", { id: "faq-docs-mutation" });
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Upload failed.";
        setMutationError(msg);
        toastError(msg, { id: "faq-docs-mutation" });
      } finally {
        setUploading(false);
      }
    },
    [apiKeyId, limits.maxBytes, refresh, token],
  );

  const remove = useCallback(
    async (documentId: string) => {
      setMutationError("");
      setBusyId(documentId);
      try {
        const res = await fetch(joinServerApiPath(`/api/v1/faq-documents/${encodeURIComponent(documentId)}`), {
          method: "DELETE",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const payload = (await res.json()) as ApiPayload;
        if (!res.ok || !payload?.success) {
          throw new Error(payload?.error?.message ?? "Delete failed.");
        }
        await refresh();
        setMutationError("");
        toastSuccess("Document deleted.", { id: "faq-docs-mutation" });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Delete failed.";
        setMutationError(msg);
        toastError(msg, { id: "faq-docs-mutation" });
      } finally {
        setBusyId(null);
      }
    },
    [refresh, token],
  );

  const replace = useCallback(
    async (documentId: string, file: File, projectApiKey: string) => {
      setMutationError("");
      void projectApiKey;
      if (file.size > limits.maxBytes) {
        const msg = `File too large. Maximum ${Math.round(limits.maxBytes / (1024 * 1024))} MB per file on your plan.`;
        setMutationError(msg);
        toastError(msg, { id: "faq-docs-mutation" });
        return;
      }
      setBusyId(documentId);
      try {
        const body = new FormData();
        body.append("file", file);
        const res = await fetch(joinServerApiPath(`/api/v1/faq-documents/${encodeURIComponent(documentId)}`), {
          method: "PATCH",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          body,
        });
        const payload = (await res.json()) as ApiPayload;
        if (!res.ok || !payload?.success) {
          throw new Error(payload?.error?.message ?? "Replace failed.");
        }
        await refresh();
        setMutationError("");
        const failed = payload.data?.processingStatus === "failed";
        if (failed) {
          toastError(payload.data?.processingError?.message ?? "Processing failed.", {
            id: "faq-docs-mutation",
          });
        } else {
          toastSuccess("Document replaced and indexed.", { id: "faq-docs-mutation" });
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Replace failed.";
        setMutationError(msg);
        toastError(msg, { id: "faq-docs-mutation" });
      } finally {
        setBusyId(null);
      }
    },
    [limits.maxBytes, refresh, token],
  );

  const reprocess = useCallback(
    async (documentId: string) => {
      setMutationError("");
      setBusyId(documentId);
      try {
        const res = await fetch(
          joinServerApiPath(`/api/v1/faq-documents/${encodeURIComponent(documentId)}/reprocess`),
          {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          },
        );
        const payload = (await res.json()) as ApiPayload;
        if (!res.ok || !payload?.success) {
          throw new Error(payload?.error?.message ?? "Reprocess failed.");
        }
        await refresh();
        setMutationError("");
        const failed = payload.data?.processingStatus === "failed";
        if (failed) {
          toastError(payload.data?.processingError?.message ?? "Reprocess failed.", {
            id: "faq-docs-mutation",
          });
        } else {
          toastSuccess("Document rechunked and reindexed.", { id: "faq-docs-mutation" });
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Reprocess failed.";
        setMutationError(msg);
        toastError(msg, { id: "faq-docs-mutation" });
      } finally {
        setBusyId(null);
      }
    },
    [refresh, token],
  );

  return {
    uploading,
    busyId,
    mutationError,
    setMutationError,
    upload,
    remove,
    replace,
    reprocess,
  };
}
