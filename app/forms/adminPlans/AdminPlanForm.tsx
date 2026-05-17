"use client";

import type { FormEvent } from "react";

import type { AdminPlanInput } from "./types";

type Props = {
  mode: "create" | "edit";
  value: AdminPlanInput;
  onChange: (next: AdminPlanInput) => void;
  saving: boolean;
  onSubmit: () => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
};

function BoolRow({
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
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-200 bg-zinc-50/80 px-3 py-2.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-zinc-300"
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-zinc-900">{label}</span>
        {hint ? <span className="mt-0.5 block text-xs text-zinc-500">{hint}</span> : null}
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
    <label className="grid gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400"
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

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div>
        <h3 className="text-lg font-semibold text-zinc-900">
          {mode === "create" ? "New plan" : `Edit ${value.name || value.slug}`}
        </h3>
        <p className="mt-1 text-sm text-zinc-600">
          Limits and flags are loaded into server memory on save and at startup.
        </p>
      </div>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="sr-only">Identity</legend>
        {mode === "create" ? (
          <label className="grid gap-1 sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Slug</span>
            <input
              required
              pattern="[a-z0-9][a-z0-9_-]*"
              value={value.slug}
              onChange={(e) => patch("slug", e.target.value.toLowerCase())}
              placeholder="free"
              className="h-10 rounded-lg border border-zinc-300 bg-white px-3 font-mono text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
            <span className="text-xs text-zinc-500">Stored on users as plan. Cannot be changed after create.</span>
          </label>
        ) : (
          <div className="sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Slug</span>
            <p className="mt-1 font-mono text-sm text-zinc-900">{value.slug}</p>
          </div>
        )}
        <label className="grid gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Name</span>
          <input
            required
            value={value.name}
            onChange={(e) => patch("name", e.target.value)}
            className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Sort order</span>
          <input
            type="number"
            min={0}
            value={value.sortOrder}
            onChange={(e) => patch("sortOrder", Number(e.target.value))}
            className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </label>
        <label className="grid gap-1 sm:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Description</span>
          <textarea
            rows={3}
            value={value.description}
            onChange={(e) => patch("description", e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Price label</span>
          <input
            value={value.priceLabel}
            onChange={(e) => patch("priceLabel", e.target.value)}
            placeholder="150k"
            className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Price note</span>
          <input
            value={value.priceNote}
            onChange={(e) => patch("priceNote", e.target.value)}
            placeholder="per month"
            className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </label>
      </fieldset>

      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="mb-1 text-sm font-semibold text-zinc-900">Flags</legend>
        <BoolRow label="Active" checked={value.isActive} onChange={(v) => patch("isActive", v)} />
        <BoolRow
          label="Default plan"
          checked={value.isDefault}
          onChange={(v) => patch("isDefault", v)}
          hint="New users receive this slug."
        />
        <BoolRow
          label="Priority queue"
          checked={value.isPriority}
          onChange={(v) => patch("isPriority", v)}
          hint="Off = best-effort queue only."
        />
        <BoolRow label="Auto embed chat" checked={value.isAutoEmbed} onChange={(v) => patch("isAutoEmbed", v)} />
        <BoolRow
          label="Custom embed app badge"
          checked={value.embedBadgeCustomizable}
          onChange={(v) => patch("embedBadgeCustomizable", v)}
          hint="Scale: hide or relabel badge; Pro: fixed “Provided by SapAi”."
        />
        <BoolRow
          label="RAG analytics"
          checked={value.ragAnalyticsEnabled}
          onChange={(v) => patch("ragAnalyticsEnabled", v)}
        />
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <legend className="mb-1 text-sm font-semibold text-zinc-900 sm:col-span-2 lg:col-span-3">
          Limits
        </legend>
        <p className="text-xs text-zinc-500 sm:col-span-2 lg:col-span-3">
          Rate limit applies per API key from the user&apos;s plan. Use 0 for unlimited. Message length is enforced on
          chat requests.
        </p>
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
        <NumField label="Max API keys" value={value.maxApiKeys} min={0} onChange={(n) => patch("maxApiKeys", n)} />
        <NumField
          label="Max PDF uploads / project"
          value={value.maxPdfUpload}
          min={0}
          onChange={(n) => patch("maxPdfUpload", n)}
        />
        <NumField label="Max PDF size (MB)" value={value.maxPdfMb} min={1} max={512} onChange={(n) => patch("maxPdfMb", n)} />
        <NumField
          label="Analytics history (days)"
          value={value.analyticsRetentionDays}
          min={0}
          onChange={(n) => patch("analyticsRetentionDays", n)}
        />
      </fieldset>

      <div className="flex flex-wrap items-center gap-3 border-t border-zinc-100 pt-4">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-900 px-5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {saving ? "Saving…" : mode === "create" ? "Create plan" : "Save changes"}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={onCancel}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60"
        >
          Cancel
        </button>
        {mode === "edit" && onDelete ? (
          <button
            type="button"
            disabled={saving}
            onClick={() => void onDelete()}
            className="ml-auto inline-flex h-10 items-center justify-center rounded-lg border border-red-200 bg-red-50 px-5 text-sm font-semibold text-red-800 hover:bg-red-100 disabled:opacity-60"
          >
            Delete
          </button>
        ) : null}
      </div>
    </form>
  );
}
