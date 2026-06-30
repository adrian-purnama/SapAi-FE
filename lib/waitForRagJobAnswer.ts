import { getServerApiBaseUrl } from "./server-api";

/** Max time to wait for job completion (Ollama/model cold start + inference can exceed 1–2 min). */
export const RAG_JOB_WAIT_TIMEOUT_MS = 10 * 60 * 1000;

const JOB_POLL_MS = 2000;

export type RagJobAuth =
  | { kind: "embed"; embedToken: string }
  | { kind: "apiKey"; apiKey: string };

export type PublicJob = {
  id?: string;
  status?: string;
  result?: { text?: string | null };
  error?: { message?: string | null };
};

export type ApiSuccess<T> = { success: true; data: T; error: null };
export type ApiFailure = {
  success: false;
  data: Record<string, unknown> | null;
  error: { message: string; code: string };
};

export type CreateJobResponse = ApiSuccess<{ job: { id: string } }> | ApiFailure;

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

function authHeaders(auth: RagJobAuth): Record<string, string> {
  return auth.kind === "embed"
    ? { "x-embed-token": auth.embedToken }
    : { "x-api-key": auth.apiKey };
}

function unwrapPublicJob(payload: unknown): PublicJob | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  if (p.success === true && p.data && typeof p.data === "object") {
    return p.data as PublicJob;
  }
  return p as PublicJob;
}

async function fetchPublicJob(
  baseUrl: string,
  jobId: string,
  auth: RagJobAuth,
): Promise<PublicJob | null> {
  const jr = await fetch(`${baseUrl}/api/v1/chat/jobs/${encodeURIComponent(jobId)}`, {
    method: "GET",
    headers: authHeaders(auth),
  });
  const payload = await jr.json().catch(() => null);
  const job = unwrapPublicJob(payload);
  if (!jr.ok || !job) return null;
  return job;
}

/** GET job status after create (dashboard RAG tester). */
export async function fetchPublicJobForAuth(
  baseUrl: string,
  jobId: string,
  auth: RagJobAuth,
): Promise<PublicJob | null> {
  return fetchPublicJob(baseUrl, jobId, auth);
}

export function formatChatJobCreateError(payload: CreateJobResponse | null): string {
  const base = payload && "error" in payload ? payload.error?.message?.trim() || "Failed to create chat job." : "Failed to create chat job.";
  const data = payload && "data" in payload ? payload.data : null;
  const issues = data && typeof data === "object" && "issues" in data ? data.issues : null;
  if (issues && typeof issues === "object") {
    const fieldErrors = (issues as { fieldErrors?: Record<string, string[]> }).fieldErrors;
    if (fieldErrors) {
      const [field, messages] = Object.entries(fieldErrors)[0] ?? [];
      const first = Array.isArray(messages) ? messages[0] : undefined;
      if (field && first) return `${base} (${field}: ${first})`;
    }
    const form = (issues as { formErrors?: string[] }).formErrors;
    if (Array.isArray(form) && form[0]) return `${base} (${form[0]})`;
  }
  return base;
}

export function parseCreateJobId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  if (p.success === true && p.data && typeof p.data === "object") {
    const job = (p.data as { job?: { id?: string } }).job;
    return typeof job?.id === "string" ? job.id : null;
  }
  const legacyJob = (p as { job?: { id?: string } }).job;
  return typeof legacyJob?.id === "string" ? legacyJob.id : null;
}

export type ChatSessionMeta = { id: string; expiresAt: string };

export function parseCreateJobSession(payload: unknown): ChatSessionMeta | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  const data =
    p.success === true && p.data && typeof p.data === "object"
      ? (p.data as Record<string, unknown>)
      : p;
  const session = data.session;
  if (!session || typeof session !== "object") return null;
  const o = session as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id.trim() : "";
  const expiresAt = typeof o.expiresAt === "string" ? o.expiresAt : "";
  if (!id || !expiresAt) return null;
  return { id, expiresAt };
}

function parseApiErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  const p = payload as Record<string, unknown>;
  if (p.success === false && p.error && typeof p.error === "object") {
    const msg = (p.error as { message?: string }).message?.trim();
    if (msg) return msg;
  }
  return fallback;
}

export async function createEmbedChatSession(baseUrl: string, embedToken: string): Promise<ChatSessionMeta> {
  const token = embedToken.trim();
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/v1/embed/sessions`, {
    method: "POST",
    headers: { "x-embed-token": token },
  });
  const payload = await res.json().catch(() => null);
  const session = parseCreateJobSession(payload);
  if (!res.ok || !session) {
    throw new Error(parseApiErrorMessage(payload, "Failed to create embed session."));
  }
  return session;
}

export async function endEmbedChatSession(
  baseUrl: string,
  embedToken: string,
  sessionId: string,
): Promise<void> {
  const token = embedToken.trim();
  const id = sessionId.trim();
  if (!id) return;
  const res = await fetch(
    `${baseUrl.replace(/\/$/, "")}/api/v1/embed/sessions/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: { "x-embed-token": token },
    },
  );
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(parseApiErrorMessage(payload, "Failed to end embed session."));
  }
}

export async function createApiKeyChatSession(baseUrl: string, apiKey: string): Promise<ChatSessionMeta> {
  const key = apiKey.trim();
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/v1/chat-sessions`, {
    method: "POST",
    headers: { "x-api-key": key },
  });
  const payload = await res.json().catch(() => null);
  const session = parseCreateJobSession(payload);
  if (!res.ok || !session) {
    throw new Error(parseApiErrorMessage(payload, "Failed to create chat session."));
  }
  return session;
}

export async function endApiKeyChatSession(
  baseUrl: string,
  apiKey: string,
  sessionId: string,
): Promise<void> {
  const key = apiKey.trim();
  const id = sessionId.trim();
  if (!id) return;
  const res = await fetch(
    `${baseUrl.replace(/\/$/, "")}/api/v1/chat-sessions/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: { "x-api-key": key },
    },
  );
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(parseApiErrorMessage(payload, "Failed to end chat session."));
  }
}

export async function waitForRagJobAnswer(
  baseUrl: string,
  jobId: string,
  auth: RagJobAuth,
  deadline = Date.now() + RAG_JOB_WAIT_TIMEOUT_MS,
): Promise<string> {
  // ponytail: poll-only — GET /jobs/:id every 2s until terminal or deadline
  while (Date.now() < deadline) {
    const job = await fetchPublicJob(baseUrl, jobId, auth);
    if (job?.status) {
      const status = job.status;
      if (status === "completed_partial" || status === "completed_full" || status === "completed") {
        return job.result?.text?.trim() || "";
      }
      if (status === "failed" || status === "cancelled") {
        throw new Error(job.error?.message || "Job failed.");
      }
    }
    await sleep(JOB_POLL_MS);
  }
  throw new Error(
    `Timed out after ${Math.round(RAG_JOB_WAIT_TIMEOUT_MS / 60_000)} minutes waiting for the answer. Try again if the model was still loading.`,
  );
}

export function getRagApiBaseUrl(): string {
  return getServerApiBaseUrl();
}
