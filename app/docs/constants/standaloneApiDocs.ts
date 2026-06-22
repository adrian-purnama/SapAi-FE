/** Mirrors server enums / allow-list for docs-only forms (keep in sync with `server/src`). */

export const TASK_TYPES = [
  "chat",
  "rag",
  "translate",
] as const;

export type TaskType = (typeof TASK_TYPES)[number];

export const MESSAGE_ROLES = ["system", "user", "assistant", "tool"] as const;

export type MessageRole = (typeof MESSAGE_ROLES)[number];
