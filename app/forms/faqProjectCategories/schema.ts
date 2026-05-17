import { z } from "zod";

/** Keep in sync with server/src/models/faqConstant.ts */
export const FAQ_PROJECT_MAX_CATEGORIES = 50;
export const FAQ_PROJECT_MAX_CATEGORY_LEN = 128;

export function parseCategoryLines(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export const categoriesDraftSchema = z.string().superRefine((raw, ctx) => {
  const lines = parseCategoryLines(raw);
  if (lines.length > FAQ_PROJECT_MAX_CATEGORIES) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `At most ${FAQ_PROJECT_MAX_CATEGORIES} categories (one per line).`,
    });
  }
  lines.forEach((line, i) => {
    if (line.length > FAQ_PROJECT_MAX_CATEGORY_LEN) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Line ${i + 1} exceeds ${FAQ_PROJECT_MAX_CATEGORY_LEN} characters.`,
      });
    }
  });
});

/** Validated list for chip/tag editor submit (trimmed, non-empty strings). */
export const categoryListSchema = z
  .array(z.string().trim().min(1, "Each label must have at least one character.").max(FAQ_PROJECT_MAX_CATEGORY_LEN))
  .max(FAQ_PROJECT_MAX_CATEGORIES, `At most ${FAQ_PROJECT_MAX_CATEGORIES} categories.`);

export function normalizeCategoryList(labels: string[]): string[] {
  return labels.map((s) => s.trim()).filter(Boolean);
}

/** Returns an error message for the add field, or null if the label can be appended. */
export function validateNewCategoryLabel(trimmed: string, existing: string[]): string | null {
  if (!trimmed) return null;
  if (trimmed.length > FAQ_PROJECT_MAX_CATEGORY_LEN) {
    return `Each label must be at most ${FAQ_PROJECT_MAX_CATEGORY_LEN} characters.`;
  }
  if (existing.length >= FAQ_PROJECT_MAX_CATEGORIES) {
    return `You can add at most ${FAQ_PROJECT_MAX_CATEGORIES} categories.`;
  }
  const lower = trimmed.toLowerCase();
  if (existing.some((x) => x.trim().toLowerCase() === lower)) {
    return "That label is already in the list.";
  }
  return null;
}
