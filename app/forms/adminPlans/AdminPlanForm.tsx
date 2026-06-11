"use client";

import type { FormEvent } from "react";

import type { AdminPlanInput } from "./types";
import styles from "./AdminPlanForm.module.css";

type Props = {
  mode: "create" | "edit";
  value: AdminPlanInput;
  onChange: (next: AdminPlanInput) => void;
  saving: boolean;
  onSubmit: () => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
};

function ToggleRow({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <label className={`${styles.toggle} ${checked ? styles.toggleOn : ""}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className={styles.toggleInput}
      />
      <span className={styles.toggleContent}>
        <span className={styles.toggleLabel}>{label}</span>
        {hint ? <span className={styles.toggleHint}>{hint}</span> : null}
      </span>
    </label>
  );
}

function NumField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className={styles.label}>
      <span className={styles.labelText}>{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={styles.input}
      />
    </label>
  );
}

export default function AdminPlanForm({
  mode,
  value,
  onChange,
  saving,
  onSubmit,
  onCancel,
  onDelete,
}: Props) {
  function patch<K extends keyof AdminPlanInput>(key: K, v: AdminPlanInput[K]) {
    onChange({ ...value, [key]: v });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await onSubmit();
  }

  const title =
    mode === "create" ? "New plan" : value.name.trim() || value.slug || "Edit plan";

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <header className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.subtitle}>
          Limits and flags reload into server memory on save and at startup.
        </p>
      </header>

      <div className={styles.body}>
        <section className={styles.section} aria-labelledby="plan-identity">
          <h4 id="plan-identity" className={styles.sectionTitle}>
            Identity
          </h4>
          <div className={styles.fieldGrid}>
            {mode === "create" ? (
              <label className={`${styles.label} ${styles.fieldGridWide}`}>
                <span className={styles.labelText}>Slug</span>
                <input
                  required
                  pattern="[a-z0-9][a-z0-9_-]*"
                  value={value.slug}
                  onChange={(e) => patch("slug", e.target.value.toLowerCase())}
                  placeholder="free"
                  className={`${styles.input} ${styles.inputMono}`}
                />
                <span className={styles.fieldHint}>
                  Stored on users as plan. Cannot be changed after create.
                </span>
              </label>
            ) : (
              <div className={`${styles.label} ${styles.fieldGridWide}`}>
                <span className={styles.labelText}>Slug</span>
                <p className={styles.readonlySlug}>{value.slug}</p>
              </div>
            )}

            <label className={styles.label}>
              <span className={styles.labelText}>Name</span>
              <input
                required
                value={value.name}
                onChange={(e) => patch("name", e.target.value)}
                className={styles.input}
              />
            </label>

            <label className={styles.label}>
              <span className={styles.labelText}>Sort order</span>
              <input
                type="number"
                min={0}
                value={value.sortOrder}
                onChange={(e) => patch("sortOrder", Number(e.target.value))}
                className={styles.input}
              />
            </label>

            <label className={`${styles.label} ${styles.fieldGridWide}`}>
              <span className={styles.labelText}>Description</span>
              <textarea
                rows={3}
                value={value.description}
                onChange={(e) => patch("description", e.target.value)}
                className={styles.textarea}
              />
            </label>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="plan-pricing">
          <h4 id="plan-pricing" className={styles.sectionTitle}>
            Pricing display
          </h4>
          <div className={styles.fieldGrid}>
            <label className={styles.label}>
              <span className={styles.labelText}>Price label</span>
              <input
                value={value.priceLabel}
                onChange={(e) => patch("priceLabel", e.target.value)}
                placeholder="150k"
                className={styles.input}
              />
            </label>
            <label className={styles.label}>
              <span className={styles.labelText}>Price note</span>
              <input
                value={value.priceNote}
                onChange={(e) => patch("priceNote", e.target.value)}
                placeholder="per month"
                className={styles.input}
              />
            </label>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="plan-flags">
          <h4 id="plan-flags" className={styles.sectionTitle}>
            Features &amp; flags
          </h4>
          <div className={styles.toggleGrid}>
            <ToggleRow label="Active" checked={value.isActive} onChange={(v) => patch("isActive", v)} />
            <ToggleRow
              label="Default plan"
              checked={value.isDefault}
              onChange={(v) => patch("isDefault", v)}
              hint="New users receive this slug."
            />
            <ToggleRow
              label="Priority queue"
              checked={value.isPriority}
              onChange={(v) => patch("isPriority", v)}
              hint="Off = best-effort queue only."
            />
            <ToggleRow
              label="Auto embed chat"
              checked={value.isAutoEmbed}
              onChange={(v) => patch("isAutoEmbed", v)}
            />
            <ToggleRow
              label="Custom embed badge"
              checked={value.embedBadgeCustomizable}
              onChange={(v) => patch("embedBadgeCustomizable", v)}
              hint="Scale: hide or relabel badge; Pro: fixed “Provided by SapAi”."
            />
            <ToggleRow
              label="RAG analytics"
              checked={value.ragAnalyticsEnabled}
              onChange={(v) => patch("ragAnalyticsEnabled", v)}
            />
          </div>
        </section>

        <section className={styles.section} aria-labelledby="plan-limits">
          <h4 id="plan-limits" className={styles.sectionTitle}>
            Limits
          </h4>
          <p className={styles.sectionHint}>
            Rate limit applies per API key. Use 0 for unlimited. Message length is enforced on chat
            requests.
          </p>
          <div className={styles.fieldGrid}>
            <NumField
              label="Rate limit (req/min per key)"
              value={value.rateLimitPerMinute}
              min={0}
              max={1_000_000}
              onChange={(n) => patch("rateLimitPerMinute", n)}
            />
            <NumField
              label="Max characters per message"
              value={value.maxCharacterPerMessage}
              min={1}
              max={1_000_000}
              onChange={(n) => patch("maxCharacterPerMessage", n)}
            />
            <NumField
              label="Max API keys"
              value={value.maxApiKeys}
              min={0}
              onChange={(n) => patch("maxApiKeys", n)}
            />
            <NumField
              label="Max PDF uploads / project"
              value={value.maxPdfUpload}
              min={0}
              onChange={(n) => patch("maxPdfUpload", n)}
            />
            <NumField
              label="Max PDF size (MB)"
              value={value.maxPdfMb}
              min={1}
              max={512}
              onChange={(n) => patch("maxPdfMb", n)}
            />
            <NumField
              label="Analytics history (days)"
              value={value.analyticsRetentionDays}
              min={0}
              onChange={(n) => patch("analyticsRetentionDays", n)}
            />
          </div>
        </section>
      </div>

      <footer className={styles.footer}>
        <button type="submit" disabled={saving} className={styles.primaryBtn}>
          {saving ? "Saving…" : mode === "create" ? "Create plan" : "Save changes"}
        </button>
        <button type="button" disabled={saving} onClick={onCancel} className={styles.secondaryBtn}>
          Cancel
        </button>
        {mode === "edit" && onDelete ? (
          <button
            type="button"
            disabled={saving}
            onClick={() => void onDelete()}
            className={styles.dangerBtn}
          >
            Delete
          </button>
        ) : null}
      </footer>
    </form>
  );
}
