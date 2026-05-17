/** Mirrors server enums / allow-list for docs-only forms (keep in sync with `server/src`). */

export const TASK_TYPES = [
  "chat",
  "rag",
] as const;

export type TaskType = (typeof TASK_TYPES)[number];

export const MESSAGE_ROLES = ["system", "user", "assistant", "tool"] as const;

export type MessageRole = (typeof MESSAGE_ROLES)[number];

// Clients send model *labels* (not raw Ollama ids), matching server `/api/v1/chat/models`.
export const ALLOWED_CHAT_MODEL_IDS = ["OCT3Q"] as const;
