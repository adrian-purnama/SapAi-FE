export type StoredEmbedChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
};

const KEY_PREFIX = "sapai-embed-chat:";
const MAX_MESSAGES = 50;
const MAX_CONTENT_CHARS = 12_000;

function storageKey(token: string): string {
  return `${KEY_PREFIX}${token.trim()}`;
}

function trimMessages(messages: StoredEmbedChatMessage[]): StoredEmbedChatMessage[] {
  const slice = messages.slice(-MAX_MESSAGES);
  return slice.map((m) => ({
    id: m.id,
    role: m.role === "user" ? "user" : "assistant",
    content:
      m.content.length > MAX_CONTENT_CHARS
        ? `${m.content.slice(0, MAX_CONTENT_CHARS)}…`
        : m.content,
    ...(m.isError ? { isError: true } : {}),
  }));
}

export function loadEmbedChatMessages(token: string): StoredEmbedChatMessage[] {
  const t = token.trim();
  if (!t || typeof window === "undefined") return [];

  try {
    const raw = sessionStorage.getItem(storageKey(t));
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
    return trimMessages(out);
  } catch {
    return [];
  }
}

export function saveEmbedChatMessages(token: string, messages: StoredEmbedChatMessage[]): void {
  const t = token.trim();
  if (!t || typeof window === "undefined") return;

  try {
    const payload = {
      messages: trimMessages(messages),
      updatedAt: Date.now(),
    };
    sessionStorage.setItem(storageKey(t), JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

export function clearEmbedChatMessages(token: string): void {
  const t = token.trim();
  if (!t || typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(storageKey(t));
  } catch {
    /* ignore */
  }
}
