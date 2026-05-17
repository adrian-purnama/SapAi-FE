/**
 * Client-safe FAQ upload limits and hints.
 * Must stay aligned with `assertAllowedFaqUpload` in `faq-documents.ts`.
 */
export const MAX_FAQ_DOCUMENT_BYTES = 15 * 1024 * 1024;

/** `accept` attribute for `<input type="file" />` — must match `assertAllowedFaqUpload` on the server. */
export const FAQ_DOCUMENT_ACCEPT_ATTR = ".md,text/markdown,text/plain";

export const FAQ_DOCUMENT_UPLOAD_HINT = "Markdown (.md) only · max 15 MB per file";
