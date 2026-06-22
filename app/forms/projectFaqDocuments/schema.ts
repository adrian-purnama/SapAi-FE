export type FaqProcessingStatus =
  | "uploaded"
  | "chunking"
  | "uploading_to_qdrant"
  | "completed"
  | "failed"
  | "reprocessing";

export type FaqProcessingError = {
  step: "chunking" | "embedding" | "qdrant";
  message: string;
};

const BUSY_STATUSES = new Set<FaqProcessingStatus>([
  "uploaded",
  "chunking",
  "uploading_to_qdrant",
  "reprocessing",
]);

export function isFaqDocumentBusy(status: FaqProcessingStatus | string | undefined): boolean {
  return BUSY_STATUSES.has(status as FaqProcessingStatus);
}

/** API shape from GET `/api/api-keys/[id]/faq-documents` → `data.documents`. */
export type ProjectFaqDocumentRow = {
  id: string;
  apiKeyId: string;
  originalFilename: string;
  contentType: string;
  length: number;
  chunk: { totalChunks: number; processedChunks: number };
  isProcessed: boolean;
  processingStatus: FaqProcessingStatus;
  processingError: FaqProcessingError | null;
  processingUpdatedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

const STALE_PROCESSING_MS = 2 * 60 * 1000;

/** Allow rechunk when failed, idle, or processing appears stuck (e.g. after server restart). */
export function canForceReprocessFaqDocument(doc: ProjectFaqDocumentRow): boolean {
  if (doc.processingStatus === "failed" || doc.processingStatus === "completed") return true;
  if (!isFaqDocumentBusy(doc.processingStatus)) return true;
  const ts = doc.processingUpdatedAt ?? doc.updatedAt;
  if (!ts) return true;
  const at = Date.parse(ts);
  if (!Number.isFinite(at)) return false;
  return Date.now() - at > STALE_PROCESSING_MS;
}

export function faqProcessingStatusLabel(status: FaqProcessingStatus): string {
  switch (status) {
    case "uploaded":
      return "Queued";
    case "chunking":
      return "Chunking…";
    case "uploading_to_qdrant":
      return "Indexing…";
    case "reprocessing":
      return "Reprocessing…";
    case "completed":
      return "Ready";
    case "failed":
      return "Failed";
    default:
      return status;
  }
}

export function formatFaqFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return " ";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
}
