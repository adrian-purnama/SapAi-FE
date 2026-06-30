"use client";

export type UserPlan = {
  slug: string;
  name: string;
  accentColor: string | null;
  analyticsRetentionDays: number;
  ragAnalyticsEnabled: boolean;
  allowMcp: boolean;
  isAutoEmbed: boolean;
  isPriority: boolean;
  rateLimitPerMinute: number;
  maxCharacterPerMessage: number;
  maxPdfUpload: number;
  maxPdfMb: number;
  maxOcrMb: number;
};

export type AuthUser = {
  id: string;
  email: string;
  isAdmin: boolean;
  isEmailVerified: boolean;
  /** Resolved subscription plan from the server; null if none assigned. */
  plan: UserPlan | null;
  /** ISO date when the assigned non-default plan expires; null if none or never. */
  planExpiresAt: string | null;
};

export function parseUserPlan(raw: unknown): UserPlan | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const slug = typeof o.slug === "string" ? o.slug : "";
  if (!slug) return null;
  return {
    slug,
    name: typeof o.name === "string" ? o.name : slug,
    accentColor: typeof o.accentColor === "string" ? o.accentColor.trim() || null : null,
    analyticsRetentionDays:
      typeof o.analyticsRetentionDays === "number" && Number.isFinite(o.analyticsRetentionDays)
        ? o.analyticsRetentionDays
        : 0,
    ragAnalyticsEnabled: Boolean(o.ragAnalyticsEnabled),
    allowMcp: Boolean(o.allowMcp),
    isAutoEmbed: Boolean(o.isAutoEmbed),
    isPriority: Boolean(o.isPriority),
    rateLimitPerMinute:
      typeof o.rateLimitPerMinute === "number" && Number.isFinite(o.rateLimitPerMinute)
        ? o.rateLimitPerMinute
        : 0,
    maxCharacterPerMessage:
      typeof o.maxCharacterPerMessage === "number" && Number.isFinite(o.maxCharacterPerMessage)
        ? o.maxCharacterPerMessage
        : 2000,
    maxPdfUpload:
      typeof o.maxPdfUpload === "number" && Number.isFinite(o.maxPdfUpload) ? o.maxPdfUpload : 5,
    maxPdfMb: typeof o.maxPdfMb === "number" && Number.isFinite(o.maxPdfMb) ? o.maxPdfMb : 15,
    maxOcrMb: typeof o.maxOcrMb === "number" && Number.isFinite(o.maxOcrMb) ? o.maxOcrMb : 10,
  };
}

export function parseAuthUserPayload(raw: unknown): AuthUser | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id : "";
  const email = typeof o.email === "string" ? o.email : "";
  if (!id || !email) return null;
  const planExpiresAtRaw = o.planExpiresAt;
  const planExpiresAt =
    typeof planExpiresAtRaw === "string" && planExpiresAtRaw.trim()
      ? planExpiresAtRaw.trim()
      : null;
  return {
    id,
    email,
    isAdmin: Boolean(o.isAdmin),
    isEmailVerified: Boolean(o.isEmailVerified),
    plan: parseUserPlan(o.plan),
    planExpiresAt,
  };
}

type AuthSession = {
  token: string;
  user: AuthUser;
};

const AUTH_STORAGE_KEY = "sapai.auth";
const AUTH_CHANGE_EVENT = "sapai-auth-changed";
const AUTH_EXPIRED_EVENT = "sapai-auth-expired";

const AUTH_SESSION_INVALID_CODES = new Set(["UNAUTHORIZED", "INVALID_TOKEN", "USER_NOT_FOUND"]);

const AUTH_ROUTES_SKIP = new Set([
  "/api/v1/auth/login",
  "/api/v1/auth/register",
  "/api/v1/auth/forgot-password",
  "/api/v1/auth/reset-password",
]);

let authFetchGuardInstalled = false;

function hasBrowserStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function getAuthExpiredEventName() {
  return AUTH_EXPIRED_EVENT;
}

export function isAuthSessionInvalidPayload(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return false;
  const o = payload as { success?: boolean; error?: { code?: string } };
  if (o.success === true) return false;
  const code = o.error?.code;
  return typeof code === "string" && AUTH_SESSION_INVALID_CODES.has(code);
}

/** Clears stored session and notifies listeners (toast / redirect handled in SapAiProvider). */
export function notifyAuthSessionExpired(): void {
  if (!hasBrowserStorage()) return;
  const hadSession = Boolean(getAuthSession());
  clearAuthSession();
  if (hadSession) {
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
  }
}

export async function handleAuthApiResponse(response: Response): Promise<void> {
  if (response.status !== 401) return;
  const payload = await response.clone().json().catch(() => null);
  if (isAuthSessionInvalidPayload(payload)) {
    notifyAuthSessionExpired();
  }
}

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

function requestPathname(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

function requestHadBearerToken(input: RequestInfo | URL, init?: RequestInit): boolean {
  const headers = new Headers(init?.headers);
  if (input instanceof Request) {
    input.headers.forEach((value, key) => headers.set(key, value));
  }
  const auth = headers.get("Authorization");
  if (auth?.startsWith("Bearer ")) return true;
  return Boolean(getAuthSession()?.token);
}

/**
 * Intercepts 401 auth failures on bearer requests to the SapAi API so expired sessions
 * are cleared app-wide without editing every fetch call site.
 */
export function installAuthFetchGuard(apiBaseUrl: string): void {
  if (!hasBrowserStorage() || authFetchGuardInstalled) return;
  authFetchGuardInstalled = true;

  const base = apiBaseUrl.replace(/\/$/, "");
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const response = await originalFetch(input, init);
    try {
      const url = requestUrl(input);
      if (!url.startsWith(base)) return response;

      const pathname = requestPathname(url);
      if (AUTH_ROUTES_SKIP.has(pathname)) return response;
      if (!requestHadBearerToken(input, init)) return response;
      if (response.status !== 401) return response;

      await handleAuthApiResponse(response);
    } catch {
      // Never break caller fetch on guard errors.
    }
    return response;
  };
}

export function setAuthSession(session: AuthSession) {
  if (!hasBrowserStorage()) return;
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function clearAuthSession() {
  if (!hasBrowserStorage()) return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function getAuthSession(): AuthSession | null {
  if (!hasBrowserStorage()) return null;
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AuthSession;
    const user = parseAuthUserPayload(parsed.user);
    if (!user || !parsed.token) return null;
    return { token: parsed.token, user };
  } catch {
    return null;
  }
}

export function getAuthChangeEventName() {
  return AUTH_CHANGE_EVENT;
}
