"use client";

export type UserPlan = {
  slug: string;
  name: string;
  analyticsRetentionDays: number;
  ragAnalyticsEnabled: boolean;
  isAutoEmbed: boolean;
  isPriority: boolean;
  rateLimitPerMinute: number;
  maxCharacterPerMessage: number;
  maxPdfUpload: number;
  maxPdfMb: number;
};

export type AuthUser = {
  id: string;
  email: string;
  isAdmin: boolean;
  isEmailVerified: boolean;
  /** Resolved subscription plan from the server; null if none assigned. */
  plan: UserPlan | null;
};

export function parseUserPlan(raw: unknown): UserPlan | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const slug = typeof o.slug === "string" ? o.slug : "";
  if (!slug) return null;
  return {
    slug,
    name: typeof o.name === "string" ? o.name : slug,
    analyticsRetentionDays:
      typeof o.analyticsRetentionDays === "number" && Number.isFinite(o.analyticsRetentionDays)
        ? o.analyticsRetentionDays
        : 0,
    ragAnalyticsEnabled: Boolean(o.ragAnalyticsEnabled),
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
  };
}

export function parseAuthUserPayload(raw: unknown): AuthUser | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id : "";
  const email = typeof o.email === "string" ? o.email : "";
  if (!id || !email) return null;
  return {
    id,
    email,
    isAdmin: Boolean(o.isAdmin),
    isEmailVerified: Boolean(o.isEmailVerified),
    plan: parseUserPlan(o.plan),
  };
}

type AuthSession = {
  token: string;
  user: AuthUser;
};

const AUTH_STORAGE_KEY = "sapai.auth";
const AUTH_CHANGE_EVENT = "sapai-auth-changed";

function hasBrowserStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
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
