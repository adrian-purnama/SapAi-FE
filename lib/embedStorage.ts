export type StoredEmbedSession = {
  sessionId: string;
  expiresAt: string;
};

export type StoredEmbedChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
};

const SESSION_KEY_PREFIX = "sapai-embed-session:";
const CHAT_KEY_PREFIX = "sapai-embed-chat:";
const MAX_CHAT_MESSAGES = 50;
const MAX_CHAT_CONTENT_CHARS = 12_000;

function sessionStorageKey(token: string): string {
  return `${SESSION_KEY_PREFIX}${token.trim()}`;
}

function chatStorageKey(token: string): string {
  return `${CHAT_KEY_PREFIX}${token.trim()}`;
}

export function isEmbedSessionValid(session: StoredEmbedSession | null): boolean {
  if (!session?.sessionId?.trim() || !session.expiresAt) return false;
  const exp = Date.parse(session.expiresAt);
  return Number.isFinite(exp) && exp > Date.now();
}

export function loadEmbedSession(token: string): StoredEmbedSession | null {
  const t = token.trim();
  if (!t || typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(sessionStorageKey(t));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredEmbedSession;
    if (typeof parsed.sessionId !== "string" || typeof parsed.expiresAt !== "string") return null;
    return isEmbedSessionValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveEmbedSession(token: string, session: StoredEmbedSession): void {
  const t = token.trim();
  if (!t || typeof window === "undefined") return;
  try {
    sessionStorage.setItem(sessionStorageKey(t), JSON.stringify(session));
  } catch {
    /* quota / private mode */
  }
}

export function clearEmbedSession(token: string): void {
  const t = token.trim();
  if (!t || typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(sessionStorageKey(t));
  } catch {
    /* ignore */
  }
}

function trimChatMessages(messages: StoredEmbedChatMessage[]): StoredEmbedChatMessage[] {
  const slice = messages.slice(-MAX_CHAT_MESSAGES);
  return slice.map((m) => ({
    id: m.id,
    role: m.role === "user" ? "user" : "assistant",
    content:
      m.content.length > MAX_CHAT_CONTENT_CHARS
        ? `${m.content.slice(0, MAX_CHAT_CONTENT_CHARS)}…`
        : m.content,
    ...(m.isError ? { isError: true } : {}),
  }));
}

export function loadEmbedChatMessages(token: string): StoredEmbedChatMessage[] {
  const t = token.trim();
  if (!t || typeof window === "undefined") return [];

  try {
    const raw = sessionStorage.getItem(chatStorageKey(t));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { messages?: unknown };
    if (!Array.isArray(parsed.messages)) return [];

    const out: StoredEmbedChatMessage[] = [];
    for (const item of parsed.messages) {
      if (!item || typeof item !== "object") continue;
      const o = item as Record<string, unknown>;
      const role = o.role === "user" ? "user" : o.role === "assistant" ? "assistant" : null;
      const content = typeof o.content === "string" ? o.content : "";
      const id = typeof o.id === "string" && o.id.trim() ? o.id.trim() : crypto.randomUUID();
      if (!role || !content.trim()) continue;
      out.push({
        id,
        role,
        content,
        ...(o.isError === true ? { isError: true } : {}),
      });
    }
    return trimChatMessages(out);
  } catch {
    return [];
  }
}

export function saveEmbedChatMessages(token: string, messages: StoredEmbedChatMessage[]): void {
  const t = token.trim();
  if (!t || typeof window === "undefined") return;

  try {
    const payload = {
      messages: trimChatMessages(messages),
      updatedAt: Date.now(),
    };
    sessionStorage.setItem(chatStorageKey(t), JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

export function clearEmbedChatMessages(token: string): void {
  const t = token.trim();
  if (!t || typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(chatStorageKey(t));
  } catch {
    /* ignore */
  }
}
