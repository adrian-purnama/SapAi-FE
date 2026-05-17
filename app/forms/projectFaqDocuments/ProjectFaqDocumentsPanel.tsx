"use client";

import type { ChangeEvent, DragEvent } from "react";
import { Fragment, useEffect, useId, useRef, useState } from "react";
import { Download, FileUp, KeyRound, Loader2, RefreshCw, RotateCcw, Tags, Trash2 } from "lucide-react";

import PasswordInput from "@/app/components/PasswordInput";
import { FaqProjectCategoriesForm } from "@/app/forms/faqProjectCategories/FaqProjectCategoriesForm";
import { useFaqProjectCategoriesData } from "@/app/forms/faqProjectCategories/useFaqProjectCategoriesData";
import { useSapAi } from "@/app/providers/sapai-provider";
import { toastError } from "@/lib/app-toast";
import { joinServerApiPath } from "@/lib/server-api";

import { FAQ_DOCUMENT_ACCEPT_ATTR } from "@/lib/faq-documents-public";

import {
  canForceReprocessFaqDocument,
  faqProcessingStatusLabel,
  formatFaqFileSize,
  isFaqDocumentBusy,
} from "./schema";
import { useFaqPlanLimits } from "./useFaqPlanLimits";
import { useProjectFaqDocumentsData } from "./useProjectFaqDocumentsData";
import { useProjectFaqDocumentsMutations } from "./useProjectFaqDocumentsMutations";
import { FaqRagEmbedSettingsCard } from "./FaqRagEmbedSettingsCard";
import { FaqRagTestForm } from "./FaqRagTestForm";

type Props = {
  apiKeyId: string;
  disabled?: boolean;
};

type PendingKeyOp =
  | { kind: "upload"; file: File }
  | { kind: "replace"; documentId: string; file: File };

export function ProjectFaqDocumentsPanel({ apiKeyId, disabled = false }: Props) {
  const { token } = useSapAi();
  const planLimits = useFaqPlanLimits();
  const uploadInputId = useId();
  const deleteModalTitleId = useId();
  const reprocessModalTitleId = useId();
  const apiKeyModalTitleId = useId();
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replaceTargetId, setReplaceTargetId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; filename: string } | null>(null);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [pendingKeyOp, setPendingKeyOp] = useState<PendingKeyOp | null>(null);
  const [projectApiKey, setProjectApiKey] = useState("");
  const [apiKeyFieldError, setApiKeyFieldError] = useState("");

  const { documents, loading, refetch } = useProjectFaqDocumentsData(apiKeyId);
  const faqLoad = useFaqProjectCategoriesData(apiKeyId);
  const mutations = useProjectFaqDocumentsMutations(apiKeyId, refetch, {
    maxBytes: planLimits.maxBytes,
  });
  const [downloadBusyId, setDownloadBusyId] = useState<string | null>(null);
  const [reprocessConfirmId, setReprocessConfirmId] = useState<string | null>(null);

  const atPdfLimit = documents.length >= planLimits.maxPdfUpload;
  const uploadBlocked = disabled || mutations.uploading || atPdfLimit;
  const uploadHint = `Markdown (.md) only · up to ${planLimits.maxPdfUpload} file${planLimits.maxPdfUpload === 1 ? "" : "s"} · max ${planLimits.maxPdfMb} MB each`;

  function onPickUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || uploadBlocked) return;
    setPendingKeyOp({ kind: "upload", file });
    setProjectApiKey("");
    setApiKeyFieldError("");
    setApiKeyModalOpen(true);
  }

  function confirmApiKeyModal() {
    const key = projectApiKey.trim();
    if (!pendingKeyOp) return;
    setApiKeyFieldError("");
    setApiKeyModalOpen(false);
    const op = pendingKeyOp;
    setPendingKeyOp(null);
    setProjectApiKey("");
    if (op.kind === "upload") void mutations.upload(op.file, key);
    else void mutations.replace(op.documentId, op.file, key);
  }

  async function downloadDocument(doc: { id: string; originalFilename: string }) {
    if (!token) {
      toastError("You must be logged in to download.", { id: "faq-docs-download" });
      return;
    }
    setDownloadBusyId(doc.id);
    try {
      const res = await fetch(
        joinServerApiPath(`/api/v1/faq-documents/${encodeURIComponent(doc.id)}`),
        { method: "GET", headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) {
        let msg = "Download failed.";
        try {
          const j = await res.json();
          msg = j?.error?.message ?? msg;
        } catch {
          // ignore
        }
        throw new Error(msg);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.originalFilename || "document";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Download failed.", { id: "faq-docs-download" });
    } finally {
      setDownloadBusyId(null);
    }
  }

  function cancelApiKeyModal() {
    setApiKeyModalOpen(false);
    setPendingKeyOp(null);
    setProjectApiKey("");
    setApiKeyFieldError("");
  }

  function startReplace(documentId: string) {
    if (disabled) return;
    const doc = documents.find((d) => d.id === documentId);
    if (doc && isFaqDocumentBusy(doc.processingStatus)) return;
    setReplaceTargetId(documentId);
    replaceInputRef.current?.click();
  }

  function onPickReplace(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const docId = replaceTargetId;
    e.target.value = "";
    setReplaceTargetId(null);
    if (!file || !docId || disabled) return;
    setPendingKeyOp({ kind: "replace", documentId: docId, file });
    setProjectApiKey("");
    setApiKeyFieldError("");
    setApiKeyModalOpen(true);
  }

  function openDeleteModal(documentId: string, filename: string) {
    if (disabled) return;
    const doc = documents.find((d) => d.id === documentId);
    if (doc && isFaqDocumentBusy(doc.processingStatus)) return;
    setDeleteTarget({ id: documentId, filename });
  }

  function confirmReprocess(documentId: string) {
    setReprocessConfirmId(null);
    void mutations.reprocess(documentId);
  }

  function closeDeleteModal() {
    setDeleteTarget(null);
  }

  useEffect(() => {
    if (!deleteTarget) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setDeleteTarget(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deleteTarget]);

  useEffect(() => {
    if (!apiKeyModalOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setApiKeyModalOpen(false);
        setPendingKeyOp(null);
        setProjectApiKey("");
        setApiKeyFieldError("");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [apiKeyModalOpen]);

  function onDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (uploadBlocked) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setPendingKeyOp({ kind: "upload", file });
      setProjectApiKey("");
      setApiKeyFieldError("");
      setApiKeyModalOpen(true);
    }
  }

  return (
    <Fragment>
    <div className="mx-auto max-w-3xl space-y-10">
      <div className="rounded-xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-zinc-900">How this page flows</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs leading-relaxed text-zinc-600">
          <li>Upload Markdown (.md) files your assistant should read.</li>
          <li>Optional: add FAQ category labels (used when classifying RAG answers).</li>
          <li>Generate an embed token, turn the embed on, then copy the public URL or iframe for your site.</li>
          <li>Use “Test question” with your API key to debug retrieval before sharing the embed.</li>
        </ol>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Step 1 · Knowledge</p>
    <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-800 ring-1 ring-sky-200">
          <FileUp className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-zinc-900">Knowledge files</h2>
          </div>
          <p className="mt-1 text-[11px] text-zinc-600">
            Upload Markdown for retrieval. Files are private to your account and scoped to this project key.
            for stability PDF and Word uploads are not supported, export content as .md first.
          </p>
        </div>
      </div>

      <input
        ref={replaceInputRef}
        type="file"
        className="sr-only"
        accept={FAQ_DOCUMENT_ACCEPT_ATTR}
        aria-hidden
        tabIndex={-1}
        onChange={onPickReplace}
      />

      <div className="mt-4">
        <input
          id={uploadInputId}
          type="file"
          className="sr-only"
          accept={FAQ_DOCUMENT_ACCEPT_ATTR}
          disabled={uploadBlocked}
          aria-label="Choose file to upload"
          onChange={onPickUpload}
        />
        <label
          htmlFor={uploadInputId}
          onDragOver={onDragOver}
          onDrop={onDrop}
          title={
            atPdfLimit
              ? `Your plan allows up to ${planLimits.maxPdfUpload} file(s) per project.`
              : undefined
          }
          className={[
            "flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors",
            uploadBlocked
              ? "cursor-not-allowed border-sky-100 bg-white/40 opacity-70"
              : "border-sky-200 bg-white/70 hover:border-sky-300",
          ].join(" ")}
        >
          {mutations.uploading ? (
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-sky-500" aria-hidden />
          ) : (
            <FileUp className="mx-auto h-8 w-8 text-sky-400" aria-hidden />
          )}
          <span className="mt-2 text-sm font-medium text-zinc-700">
            {disabled
              ? "Upload disabled (key revoked)"
              : atPdfLimit
                ? "File limit reached for your plan"
                : "Drop a file here or click to browse"}
          </span>
          <span className="mt-1 text-xs text-zinc-500">{uploadHint}</span>
        </label>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <p className="text-xs text-zinc-500">
          {documents.length}/{planLimits.maxPdfUpload} files · max {planLimits.maxPdfMb} MB each · private download
          links
        </p>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-white px-2 py-1 text-xs font-medium text-sky-900 hover:bg-sky-50"
          onClick={() => void refetch()}
          disabled={loading}
          aria-label="Refresh file list"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} aria-hidden />
          Refresh
        </button>
      </div>

      {loading && documents.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-600">Loading files…</p>
      ) : documents.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-sky-100 bg-white/60 px-3 py-6 text-center text-sm text-zinc-600">
          No documents yet. Upload a file to attach it to this project.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {documents.map((doc) => {
            const busy = mutations.busyId === doc.id;
            const processing = isFaqDocumentBusy(doc.processingStatus);
            const statusLabel = faqProcessingStatusLabel(doc.processingStatus);
            const statusClass =
              doc.processingStatus === "completed"
                ? "rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-800 ring-1 ring-emerald-100"
                : doc.processingStatus === "failed"
                  ? "rounded-full bg-red-50 px-2 py-0.5 font-medium text-red-800 ring-1 ring-red-100"
                  : processing
                    ? "rounded-full bg-sky-50 px-2 py-0.5 font-medium text-sky-900 ring-1 ring-sky-100"
                    : "rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-900 ring-1 ring-amber-100";
            const actionLocked = disabled || busy || mutations.uploading || processing;
            const canRechunk = canForceReprocessFaqDocument(doc);
            const rechunkLocked = disabled || busy || mutations.uploading || (processing && !canRechunk);
            return (
              <li
                key={doc.id}
                className="flex flex-wrap items-start gap-2 rounded-lg border border-sky-100 bg-white/90 px-3 py-2 text-sm"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate font-mono text-xs text-zinc-800" title={doc.originalFilename}>
                    {doc.originalFilename}
                  </span>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-600">
                    <span className="tabular-nums">
                      Chunks {doc.chunk.processedChunks}/{doc.chunk.totalChunks}
                    </span>
                    <span className={statusClass}>{statusLabel}</span>
                    {doc.processingError ? (
                      <span className="text-red-700" title={doc.processingError.message}>
                        {doc.processingError.step}: {doc.processingError.message}
                      </span>
                    ) : null}
                  </div>
                </div>
                <span className="shrink-0 text-xs tabular-nums text-zinc-500">{formatFaqFileSize(doc.length)}</span>
                <span className="shrink-0 text-[10px] uppercase tracking-wide text-zinc-400">
                  {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : "—"}
                </span>
                <span className="ml-auto flex shrink-0 flex-wrap items-center gap-1">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-md border border-sky-200 bg-white px-2 py-1 text-xs font-medium text-sky-900 hover:bg-sky-50 disabled:opacity-50"
                    disabled={disabled || busy || mutations.uploading || downloadBusyId === doc.id}
                    onClick={() => void downloadDocument({ id: doc.id, originalFilename: doc.originalFilename })}
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden />
                    {downloadBusyId === doc.id ? "Downloading…" : "Download"}
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
                    disabled={actionLocked}
                    title={processing ? "File is still being processed." : undefined}
                    onClick={() => startReplace(doc.id)}
                  >
                    {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : null}
                    Replace
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-md border border-violet-200 bg-white px-2 py-1 text-xs font-medium text-violet-900 hover:bg-violet-50 disabled:opacity-50"
                    disabled={rechunkLocked}
                    title={
                      processing && !canRechunk
                        ? "Wait until processing finishes, or use Rechunk if indexing appears stuck."
                        : canRechunk && processing
                          ? "Processing may have stopped; restart chunking and indexing from the stored file."
                          : "Clear chunks and vectors, then rechunk and reindex from the stored file."
                    }
                    onClick={() => setReprocessConfirmId(doc.id)}
                  >
                    {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <RotateCcw className="h-3.5 w-3.5" aria-hidden />}
                    Rechunk
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-800 hover:bg-red-50 disabled:opacity-50"
                    disabled={actionLocked}
                    title={processing ? "File is still being processed." : undefined}
                    onClick={() => openDeleteModal(doc.id, doc.originalFilename)}
                    aria-label={`Delete ${doc.originalFilename}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Step 2 · Categories</p>
    <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-800 ring-1 ring-violet-200">
          <Tags className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-zinc-900">FAQ categories</h2>
          </div>
          <p className="mt-1 text-[11px] text-zinc-600">
            Add short labels as tags (e.g. billing, returns, other) to classify RAG answers. This is used for RAG insights and classification.
          </p>
        </div>
      </div>
      <FaqProjectCategoriesForm apiKeyId={apiKeyId} faqLoad={faqLoad} disabled={disabled} embedded />
      <p className="mt-3 text-[11px] text-zinc-500">Hint : Up to 50 labels · 128 characters each · Enter or Add to append</p>
    </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Step 3 · Public embed</p>
    <FaqRagEmbedSettingsCard apiKeyId={apiKeyId} disabled={disabled} faqLoad={faqLoad} />
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Step 4 · Test It</p>
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-800 ring-1 ring-zinc-200">
          <KeyRound className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-zinc-900">Test your knowledge retrival</h2>
          </div>
          <p className="mt-1 text-[11px] text-zinc-600">
            Ask a question against your uploaded knowledge files, this uses
            <code className="rounded bg-zinc-100 px-1 font-mono text-xs">/api/v1/chat</code> with{" "}
            <code className="rounded bg-zinc-100 px-1 font-mono text-xs">taskType=rag</code>.
          </p>
        </div>
      </div>

      <div className="mt-4">
        <FaqRagTestForm disabled={disabled} />
      </div>
    </div>
      </div>
    </div>

      {reprocessConfirmId ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={reprocessModalTitleId}
        >
          <button
            type="button"
            className="absolute inset-0 bg-zinc-950/30"
            aria-label="Close dialog"
            onClick={() => setReprocessConfirmId(null)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-800 ring-1 ring-violet-200">
                <RotateCcw className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h3 id={reprocessModalTitleId} className="text-lg font-semibold text-zinc-900">
                  Rechunk &amp; reupload?
                </h3>
                <p className="mt-1 text-sm text-zinc-600">
                  Deletes all chunks and search vectors, then rebuilds from the stored file.
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                className="h-10 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                onClick={() => setReprocessConfirmId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-violet-700 px-4 text-sm font-semibold text-white hover:bg-violet-800"
                onClick={() => confirmReprocess(reprocessConfirmId)}
              >
                <RotateCcw className="h-4 w-4" aria-hidden />
                Rechunk &amp; reupload
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={deleteModalTitleId}
        >
          <button
            type="button"
            className="absolute inset-0 bg-zinc-950/30"
            aria-label="Close dialog"
            onClick={closeDeleteModal}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-700 ring-1 ring-red-200">
                <Trash2 className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h3 id={deleteModalTitleId} className="text-lg font-semibold text-zinc-900">
                  Delete file?
                </h3>
                <p className="mt-1 text-sm text-zinc-600">
                  This removes the file from this project’s knowledge store. This cannot be undone.{" "}
                  <span className="font-semibold text-zinc-900">{deleteTarget.filename}</span>
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                className="h-10 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                onClick={closeDeleteModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700"
                onClick={() => {
                  const id = deleteTarget.id;
                  closeDeleteModal();
                  void mutations.remove(id);
                }}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {apiKeyModalOpen && pendingKeyOp ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={apiKeyModalTitleId}
        >
          <button
            type="button"
            className="absolute inset-0 bg-zinc-950/30"
            aria-label="Close dialog"
            onClick={cancelApiKeyModal}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-800 ring-1 ring-sky-200">
                <KeyRound className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <h3 id={apiKeyModalTitleId} className="text-lg font-semibold text-zinc-900">
                  Project API key
                </h3>
                <p className="mt-1 text-sm text-zinc-600">
                  {pendingKeyOp.kind === "upload"
                    ? "Optionally paste the project API key (not required for uploads)."
                    : "Optionally paste the project API key (not required for replace)."}{" "}
                  Keys start with <code className="rounded bg-zinc-100 px-1 font-mono text-xs">sapai_sk_</code>. You
                  can copy it from the dashboard after creating a key.
                </p>
                <div className="mt-4">
                  <PasswordInput
                    label="API key"
                    value={projectApiKey}
                    onChange={(v) => {
                      setProjectApiKey(v);
                      setApiKeyFieldError("");
                    }}
                    autoComplete="off"
                    placeholder="sapai_sk_…"
                  />
                  {apiKeyFieldError ? (
                    <p className="mt-2 text-sm text-red-700" role="alert">
                      {apiKeyFieldError}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                className="h-10 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                onClick={cancelApiKeyModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-700"
                onClick={confirmApiKeyModal}
              >
                {pendingKeyOp.kind === "upload" ? "Continue upload" : "Replace file"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Fragment>
  );
}
