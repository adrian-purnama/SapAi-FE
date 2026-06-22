import { getServerApiBaseUrl } from "./server-api";

/** Max time to wait for job completion (Ollama/model cold start + inference can exceed 1–2 min). */
export const RAG_JOB_WAIT_TIMEOUT_MS = 10 * 60 * 1000;

const FALLBACK_POLL_MS = 2000;

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

function buildChatJobStreamWsUrl(baseUrl: string, jobId: string, auth: RagJobAuth): string {
  const wsBase = baseUrl.replace(/^https:\/\//i, "wss://").replace(/^http:\/\//i, "ws://");
  const query =
    auth.kind === "embed"
      ? `embedToken=${encodeURIComponent(auth.embedToken)}`
      : `apiKey=${encodeURIComponent(auth.apiKey)}`;
  return `${wsBase}/api/v1/chat/jobs/${encodeURIComponent(jobId)}/stream?${query}`;
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

export async function waitForRagJobAnswer(
  baseUrl: string,
  jobId: string,
  auth: RagJobAuth,
  deadline = Date.now() + RAG_JOB_WAIT_TIMEOUT_MS,
): Promise<string> {
  let done = false;
  let ws: WebSocket | null = null;
  let fallbackStarted = false;

  const cleanupWs = () => {
    if (!ws) return;
    try {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    } catch {
      /* ignore */
    }
    ws = null;
  };

  return new Promise<string>((resolve, reject) => {
    let timeoutHandle: ReturnType<typeof setTimeout>;

    const fail = (msg: string) => {
      if (done) return;
      done = true;
      clearTimeout(timeoutHandle);
      cleanupWs();
      reject(new Error(msg));
    };

    const succeedWithText = (text: string) => {
      if (done) return;
      done = true;
      clearTimeout(timeoutHandle);
      cleanupWs();
      resolve(text);
    };

    const handleJob = (job: PublicJob | null): void => {
      if (!job?.status || done) return;
      const status = job.status;
      if (status === "completed_partial" || status === "completed_full" || status === "completed") {
        succeedWithText(job.result?.text?.trim() || "");
        return;
      }
      if (status === "failed" || status === "cancelled") {
        fail(job.error?.message || "Job failed.");
      }
    };

    const startFallbackPoll = () => {
      if (fallbackStarted || done) return;
      fallbackStarted = true;
      void (async () => {
        while (!done && Date.now() < deadline) {
          await sleep(FALLBACK_POLL_MS);
          if (done) return;
          try {
            const job = await fetchPublicJob(baseUrl, jobId, auth);
            handleJob(job);
          } catch {
            /* keep polling until deadline */
          }
        }
      })();
    };

    timeoutHandle = setTimeout(() => {
      fail(
        `Timed out after ${Math.round(RAG_JOB_WAIT_TIMEOUT_MS / 60_000)} minutes waiting for the answer. Try again if the model was still loading.`,
      );
    }, Math.max(0, deadline - Date.now()));

    try {
      ws = new WebSocket(buildChatJobStreamWsUrl(baseUrl, jobId, auth));
    } catch {
      startFallbackPoll();
      return;
    }

    ws.onmessage = (ev) => {
      try {
        const job = JSON.parse(String(ev.data)) as PublicJob;
        handleJob(job);
      } catch {
        /* ignore non-JSON */
      }
    };

    ws.onerror = () => {
      if (!done) startFallbackPoll();
    };

    ws.onclose = () => {
      if (done) return;
      void fetchPublicJob(baseUrl, jobId, auth).then((job) => {
        if (done) return;
        handleJob(job);
        if (!done) startFallbackPoll();
      });
    };
  });
}

export function getRagApiBaseUrl(): string {
  return getServerApiBaseUrl();
}
