"use client";

import { FormEvent, useEffect, useState } from "react";

import { joinServerApiPath } from "@/lib/server-api";
import { toastError, toastSuccess } from "@/lib/app-toast";

import { initialEditIpAllowlistText } from "./initialEditIpAllowlistText";

export type EditApiKeyAccessModalProps = {
  open: boolean;
  apiKeyId: string;
  apiKeyLabel: string;
  ipAllowlist: string[] | undefined;
  token: string | null | undefined;
  onClose: () => void;
  /** Called after a successful PATCH (reload parent data here). */
  onSaved: () => void | Promise<void>;
};

export function EditApiKeyAccessModal({
  open,
  apiKeyId,
  apiKeyLabel,
  ipAllowlist,
  token,
  onClose,
  onSaved,
}: EditApiKeyAccessModalProps) {
  const [allowlist, setAllowlist] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !apiKeyId) return;
    setAllowlist(initialEditIpAllowlistText({ ipAllowlist }));
  }, [open, apiKeyId, ipAllowlist]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token?.trim() || !apiKeyId) return;
    setSaving(true);
    try {
      const response = await fetch(joinServerApiPath(`/api/v1/api-keys/${encodeURIComponent(apiKeyId)}`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ipAllowlist: allowlist }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error?.message ?? "Failed to save.");
      }
      onClose();
      await onSaved();
      toastSuccess("Access settings saved.", { id: "edit-api-key-access" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed.";
      toastError(message, { id: "edit-api-key-access" });
    } finally {
      setSaving(false);
    }
  }

  if (!open || !apiKeyId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-zinc-950/30" aria-label="Close" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900">Edit API access</h3>
            <p className="mt-1 text-sm text-zinc-600">{apiKeyLabel}</p>
          </div>
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <form className="mt-5 grid gap-4" onSubmit={(e) => void onSubmit(e)}>
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium text-zinc-800">IP allowlist</span>
            <span className="text-xs text-zinc-500">
              One IPv4 or IPv6 per line. <strong className="font-medium text-zinc-700">Allow all:</strong> only{" "}
              <code className="font-mono">0.0.0.0</code> on its own (shown above when this key has no restriction
              rows). <strong className="font-medium text-zinc-700">Restrict:</strong> list each allowed IP. Request
              limits follow your subscription plan.
            </span>
            <textarea
              className="min-h-[120px] rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200"
              value={allowlist}
              onChange={(e) => setAllowlist(e.target.value)}
              placeholder={
                "Allow all:\n0.0.0.0\n\nRestrict (examples):\n203.0.113.10\n203.0.113.11\n2001:db8::1"
              }
            />
          </label>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="h-10 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-10 rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
