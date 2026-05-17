"use client";

import { useState } from "react";
import { Layers, Plus, RefreshCw } from "lucide-react";

import AdminPlanForm from "./AdminPlanForm";
import { EMPTY_PLAN_INPUT, planToInput, type AdminPlan, type AdminPlanInput } from "./types";
import { useAdminPlans } from "./useAdminPlans";

function pill(active: boolean, label: string) {
  return (
    <span
      className={
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold " +
        (active ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-zinc-200 bg-zinc-50 text-zinc-600")
      }
    >
      {label}
    </span>
  );
}

export default function AdminPlansPanel() {
  const { plans, loading, saving, error, hasAuth, refetch, createPlan, updatePlan, deletePlan } =
    useAdminPlans();

  const [editorMode, setEditorMode] = useState<"none" | "create" | "edit">("none");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AdminPlanInput>(EMPTY_PLAN_INPUT);

  function openCreate() {
    setEditorMode("create");
    setEditingId(null);
    setDraft(EMPTY_PLAN_INPUT);
  }

  function openEdit(plan: AdminPlan) {
    setEditorMode("edit");
    setEditingId(plan.id);
    setDraft(planToInput(plan));
  }

  function closeEditor() {
    setEditorMode("none");
    setEditingId(null);
    setDraft(EMPTY_PLAN_INPUT);
  }

  async function handleSubmit() {
    if (editorMode === "create") {
      await createPlan(draft);
      closeEditor();
    } else if (editorMode === "edit" && editingId) {
      await updatePlan(editingId, draft);
      closeEditor();
    }
  }

  async function handleDelete() {
    if (!editingId) return;
    const plan = plans.find((p) => p.id === editingId);
    const label = plan?.name ?? plan?.slug ?? "this plan";
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return;
    await deletePlan(editingId);
    closeEditor();
  }

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-sm">
            <Layers className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Plans</h2>
            <p className="mt-0.5 text-sm text-zinc-600">
              Subscription limits stored in MongoDB and kept in server memory for fast lookups.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void refetch()}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50"
          >
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
            Refresh
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
          >
            <Plus className="mr-2 h-4 w-4" aria-hidden />
            New plan
          </button>
        </div>
      </div>

      {!hasAuth ? (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Authentication required (admin).
        </p>
      ) : loading ? (
        <p className="mt-4 text-sm text-zinc-600">Loading plans…</p>
      ) : error ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p className="text-sm text-zinc-600">{error}</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_minmax(0,420px)]">
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            {plans.length === 0 ? (
              <p className="px-6 py-8 text-sm text-zinc-600">
                No plans yet. Create free, pro, and scale to match your pricing page.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    <tr>
                      <th className="px-4 py-3">Plan</th>
                      <th className="px-4 py-3">Req/min</th>
                      <th className="px-4 py-3">Chars/msg</th>
                      <th className="px-4 py-3">Keys</th>
                      <th className="px-4 py-3">PDFs</th>
                      <th className="px-4 py-3">MB</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {plans.map((p) => (
                      <tr key={p.id} className={editingId === p.id ? "bg-violet-50/50" : undefined}>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-zinc-900">{p.name}</p>
                          <p className="font-mono text-xs text-zinc-500">{p.slug}</p>
                          {p.isDefault ? (
                            <span className="mt-1 inline-block text-xs font-medium text-violet-700">Default</span>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-zinc-700">
                          {p.rateLimitPerMinute === 0 ? "∞" : p.rateLimitPerMinute}
                        </td>
                        <td className="px-4 py-3 text-zinc-700">{p.maxCharacterPerMessage}</td>
                        <td className="px-4 py-3 text-zinc-700">{p.maxApiKeys}</td>
                        <td className="px-4 py-3 text-zinc-700">{p.maxPdfUpload}</td>
                        <td className="px-4 py-3 text-zinc-700">{p.maxPdfMb}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {pill(p.isActive, p.isActive ? "active" : "inactive")}
                            {p.isPriority ? pill(true, "priority") : null}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => openEdit(p)}
                            className="text-sm font-semibold text-zinc-800 hover:text-zinc-950"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {editorMode !== "none" ? (
            <AdminPlanForm
              mode={editorMode}
              value={draft}
              onChange={setDraft}
              saving={saving}
              onSubmit={handleSubmit}
              onCancel={closeEditor}
              onDelete={editorMode === "edit" ? handleDelete : undefined}
            />
          ) : (
            <div className="flex items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 p-8 text-center text-sm text-zinc-500">
              Select a plan to edit or create a new one.
            </div>
          )}
        </div>
      )}
    </section>
  );
}
