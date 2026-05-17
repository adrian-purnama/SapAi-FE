"use client";

import { FormEvent, useEffect, useId, useState } from "react";
import { Plus, X } from "lucide-react";

import {
  categoryListSchema,
  FAQ_PROJECT_MAX_CATEGORIES,
  FAQ_PROJECT_MAX_CATEGORY_LEN,
  normalizeCategoryList,
  validateNewCategoryLabel,
} from "./schema";
import type { FaqProjectCategoriesLoadState } from "./useFaqProjectCategoriesData";
import { useFaqProjectCategoriesSubmit } from "./useFaqProjectCategoriesSubmit";

import styles from "./FaqProjectCategoriesForm.module.css";

type Props = {
  apiKeyId: string;
  /** Shared GET …/faq-constants (categories + embed); supplied by `ProjectFaqDocumentsPanel` to avoid duplicate fetches. */
  faqLoad: FaqProjectCategoriesLoadState;
  disabled?: boolean;
  /** Omit title/hint; use field styles aligned with RAG test panel (parent supplies card chrome). */
  embedded?: boolean;
};

export function FaqProjectCategoriesForm({ apiKeyId, faqLoad, disabled = false, embedded = false }: Props) {
  const { categories, loading, error: loadError, refetch } = faqLoad;
  const { saveCategories, saving, clearError } = useFaqProjectCategoriesSubmit(apiKeyId);
  const [items, setItems] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState("");
  const [validationError, setValidationError] = useState("");
  const formId = useId();
  const listboxId = `${formId}-listbox`;

  useEffect(() => {
    if (loading) return;
    setItems([...categories]);
    setInput("");
    setInputError("");
  }, [loading, categories]);

  function tryAddLabel(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) {
      setInput("");
      setInputError("");
      return;
    }
    const err = validateNewCategoryLabel(trimmed, items);
    if (err) {
      setInputError(err);
      return;
    }
    setItems((prev) => [...prev, trimmed]);
    setInput("");
    setInputError("");
    setValidationError("");
    clearError();
  }

  function removeAt(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
    setValidationError("");
    clearError();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (disabled) return;
    setValidationError("");
    clearError();
    const normalized = normalizeCategoryList(items);
    const parsed = categoryListSchema.safeParse(normalized);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Invalid categories.";
      setValidationError(msg);
      return;
    }
    const result = await saveCategories(parsed.data);
    if (result.ok) {
      setItems([...result.categories]);
      await refetch();
    }
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      tryAddLabel(input);
      return;
    }
    if (e.key === "Backspace" && input === "" && items.length > 0) {
      e.preventDefault();
      removeAt(items.length - 1);
    }
  }

  const blocked = disabled || loading;
  const showError = loadError || validationError;

  const chipWrapClass = embedded
    ? "flex min-h-[2.75rem] flex-wrap items-center gap-2 rounded-lg border border-violet-200/90 bg-white px-2 py-2 shadow-sm focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-200/60"
    : "flex min-h-[2.75rem] flex-wrap items-center gap-2 rounded-lg border border-zinc-300 bg-white px-2 py-2 shadow-sm focus-within:border-zinc-500 focus-within:ring-2 focus-within:ring-zinc-200";

  const chipClass = embedded
    ? "inline-flex max-w-full items-center gap-1 rounded-full border border-violet-200 bg-violet-50 pl-2.5 pr-1 py-0.5 text-xs font-medium text-violet-950"
    : "inline-flex max-w-full items-center gap-1 rounded-full border border-zinc-200 bg-zinc-100 pl-2.5 pr-1 py-0.5 text-xs font-medium text-zinc-900";

  const inputClass =
    "min-w-[6rem] flex-1 border-0 bg-transparent py-1 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 disabled:opacity-50";

  const actionsClass = embedded ? "mt-3 flex flex-wrap items-center justify-between gap-2" : styles.actions;
  const saveClass = embedded
    ? "inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
    : styles.save;
  const errorClass = embedded ? "mt-2 text-sm text-red-700" : styles.error;

  const body = (
    <>
      {!embedded ? (
        <>
          <h2 id="faq-project-categories-heading" className={styles.title}>
            FAQ categories
          </h2>
          <p className={styles.hint}>
            Add short labels (e.g. <code className="rounded bg-zinc-100 px-1 text-[11px]">shipping</code>) — they help
            classify RAG answers for this project. Press{" "}
            <kbd className="rounded border border-zinc-200 bg-white px-1 font-mono text-[10px]">Enter</kbd> or use Add.
            Max {FAQ_PROJECT_MAX_CATEGORIES} labels, {FAQ_PROJECT_MAX_CATEGORY_LEN} characters each.
          </p>
        </>
      ) : null}
      <form onSubmit={(ev) => void onSubmit(ev)} aria-labelledby={embedded ? undefined : "faq-project-categories-heading"}>
        <label className="sr-only" htmlFor={`${formId}-add`}>
          Add category label
        </label>
        <div
          id={listboxId}
          role="list"
          aria-label="Category labels"
          className={embedded ? "mt-4" : "mt-3"}
        >
          <div className={chipWrapClass}>
            {items.map((label, index) => (
              <span key={`${index}-${label}`} role="listitem" className={chipClass}>
                <span className="max-w-[min(18rem,100%)] truncate" title={label}>
                  {label}
                </span>
                <button
                  type="button"
                  className={
                    embedded
                      ? "rounded-full p-0.5 text-violet-800/80 hover:bg-violet-200/80 hover:text-violet-950 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-violet-600 disabled:opacity-40"
                      : "rounded-full p-0.5 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-zinc-500 disabled:opacity-40"
                  }
                  aria-label={`Remove ${label}`}
                  disabled={blocked}
                  onClick={() => removeAt(index)}
                >
                  <X className="h-3.5 w-3.5 shrink-0" aria-hidden />
                </button>
              </span>
            ))}
            <input
              id={`${formId}-add`}
              type="text"
              className={`${inputClass} ${!embedded ? "" : ""}`}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setInputError("");
                clearError();
              }}
              onKeyDown={onInputKeyDown}
              disabled={blocked}
              placeholder={items.length === 0 ? "Type a label, then Enter…" : "Add another…"}
              maxLength={FAQ_PROJECT_MAX_CATEGORY_LEN + 8}
              spellCheck={false}
              autoComplete="off"
            />
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={
              embedded
                ? "inline-flex items-center gap-1.5 rounded-lg border border-violet-300 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-950 hover:bg-violet-100 disabled:opacity-50"
                : "inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-zinc-100 disabled:opacity-50"
            }
            disabled={blocked || !input.trim()}
            onClick={() => tryAddLabel(input)}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Add label
          </button>
          <span className="text-[11px] text-zinc-500">
            {items.length} / {FAQ_PROJECT_MAX_CATEGORIES} · comma or Enter adds
          </span>
        </div>

        {inputError ? (
          <p className="mt-2 text-xs text-amber-800" role="status">
            {inputError}
          </p>
        ) : null}

        <div className={actionsClass}>
          <button type="submit" className={saveClass} disabled={blocked || saving}>
            {saving ? "Saving…" : "Save categories"}
          </button>
        </div>
      </form>
      {showError ? (
        <p className={errorClass} role="alert">
          {validationError || loadError}
        </p>
      ) : null}
    </>
  );

  if (embedded) {
    return <>{body}</>;
  }

  return (
    <section className={styles.section} aria-labelledby="faq-project-categories-heading">
      {body}
    </section>
  );
}
