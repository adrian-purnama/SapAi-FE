"use client";

import { useState } from "react";
import { Layers, Pencil, Plus, RefreshCw, X } from "lucide-react";

import AdminPlanForm from "./AdminPlanForm";
import { EMPTY_PLAN_INPUT, planToInput, taskAccessFromCatalog, type AdminPlan, type AdminPlanImageState, type AdminPlanInput } from "./types";
import { useAdminPlans } from "./useAdminPlans";
import styles from "./AdminPlansPanel.module.css";
import { joinServerApiPath } from "@/lib/server-api";

const EMPTY_IMAGE_STATE: AdminPlanImageState = {
  imageFile: null,
  removeImage: false,
  imagePreviewUrl: null,
};

function planImagePreviewUrl(plan: AdminPlan): string | null {
  if (!plan.imageFileId) return null;
  return joinServerApiPath(`/api/v1/files/${plan.imageFileId}`);
}

function formatRateLimit(n: number) {
  return n === 0 ? "∞ req/min" : `${n} req/min`;
}

function formatInFlightLimit(n: number) {
  return n === 0 ? "∞ in-flight" : `${n} in-flight`;
}

function PlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: AdminPlan;
  selected: boolean;
  onSelect: () => void;
}) {
  const price =
    plan.priceLabel?.trim() ?
      [plan.priceLabel, plan.priceNote?.trim()].filter(Boolean).join(" ")
    : null;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        styles.planCard,
        selected ? styles.planCardSelected : "",
        !plan.isActive ? styles.planCardInactive : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-pressed={selected}
      aria-label={`Edit ${plan.name}`}
    >
      <div className={styles.planCardHeader}>
        <div className={styles.planCardTitle}>
          <p className={styles.planName}>{plan.name}</p>
          <p className={styles.planSlug}>{plan.slug}</p>
        </div>
        {price ? <span className={styles.planPrice}>{price}</span> : null}
      </div>

      {plan.description?.trim() ? (
        <p className={styles.planDescription}>{plan.description}</p>
      ) : null}

      <div className={styles.statRow}>
        <span className={styles.statChip}>{formatRateLimit(plan.rateLimitPerMinute)}</span>
        <span className={styles.statChip}>{formatInFlightLimit(plan.maxChatInFlight)}</span>
        <span className={styles.statChip}>{plan.maxCharacterPerMessage.toLocaleString()} chars</span>
        <span className={styles.statChip}>{plan.maxApiKeys} keys</span>
        <span className={styles.statChip}>
          {plan.maxPdfUpload} PDF · {plan.maxPdfMb} MB
        </span>
        <span className={styles.statChip}>OCR {plan.maxOcrMb} MB</span>
      </div>

      <div className={styles.badgeRow}>
        <span className={`${styles.badge} ${plan.isActive ? styles.badgeActive : styles.badgeInactive}`}>
          {plan.isActive ? "Active" : "Inactive"}
        </span>
        {plan.isDefault ? (
          <span className={`${styles.badge} ${styles.badgeDefault}`}>Default</span>
        ) : null}
        {plan.isPriority ? (
          <span className={`${styles.badge} ${styles.badgePriority}`}>Priority</span>
        ) : null}
        {plan.showOnPricingPage ? (
          <span className={`${styles.badge} ${styles.badgeDefault}`}>Pricing</span>
        ) : null}
      </div>
    </button>
  );
}

export default function AdminPlansPanel() {
  const { plans, taskCatalog, loading, saving, error, hasAuth, refetch, createPlan, updatePlan, deletePlan } =
    useAdminPlans();

  const [editorMode, setEditorMode] = useState<"none" | "create" | "edit">("none");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AdminPlanInput>(EMPTY_PLAN_INPUT);
  const [imageState, setImageState] = useState<AdminPlanImageState>(EMPTY_IMAGE_STATE);

  function openCreate() {
    setEditorMode("create");
    setEditingId(null);
    setImageState(EMPTY_IMAGE_STATE);
    setDraft({
      ...EMPTY_PLAN_INPUT,
      taskAccess: taskAccessFromCatalog(taskCatalog),
    });
  }

  function openEdit(plan: AdminPlan) {
    setEditorMode("edit");
    setEditingId(plan.id);
    setDraft(planToInput(plan));
    setImageState({
      imageFile: null,
      removeImage: false,
      imagePreviewUrl: planImagePreviewUrl(plan),
    });
  }

  function closeEditor() {
    setEditorMode("none");
    setEditingId(null);
    setDraft(EMPTY_PLAN_INPUT);
    setImageState(EMPTY_IMAGE_STATE);
  }

  async function handleSubmit() {
    if (editorMode === "create") {
      await createPlan(draft, imageState);
      closeEditor();
    } else if (editorMode === "edit" && editingId) {
      await updatePlan(editingId, draft, imageState);
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

  const editorOpen = editorMode !== "none";
  const editingPlan = editingId ? plans.find((p) => p.id === editingId) : null;

  return (
    <section className={styles.panel} aria-label="Subscription plans">
      <div className={styles.toolbar}>
        {/* <p className={styles.toolbarMeta}>
          {loading ? "Loading…" : `${plans.length} plan${plans.length === 1 ? "" : "s"} in MongoDB`}
        </p> */}
        <div className={styles.toolbarActions}>
          <button type="button" onClick={() => void refetch()} className={styles.iconBtn}>
            <RefreshCw className="h-4 w-4" aria-hidden />
            Refresh
          </button>
          <button type="button" onClick={openCreate} className={styles.primaryBtn}>
            <Plus className="h-4 w-4" aria-hidden />
            New plan
          </button>
        </div>
      </div>

      {!hasAuth ? (
        <div className={`${styles.stateBox} ${styles.stateBoxWarn}`}>
          Authentication required (admin).
        </div>
      ) : loading ? (
        <div className={styles.stateBox}>Loading plans…</div>
      ) : error ? (
        <div className={`${styles.stateBox} ${styles.stateBoxError}`}>
          <span>{error}</span>
          <button type="button" onClick={() => void refetch()} className={styles.retryBtn}>
            Retry
          </button>
        </div>
      ) : (
        <div
          className={[styles.layout, editorOpen ? styles.layoutWithEditor : ""].filter(Boolean).join(" ")}
        >
          <div className={styles.listRegion}>
            {editorOpen ? (
              <div className={styles.mobileEditorBanner}>
                <span className="inline-flex items-center gap-2">
                  <Pencil className="h-4 w-4 shrink-0" aria-hidden />
                  {editorMode === "create" ? "Creating new plan" : `Editing ${editingPlan?.name ?? "plan"}`}
                </span>
                <button
                  type="button"
                  onClick={closeEditor}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-violet-200 bg-white text-violet-800"
                  aria-label="Close editor"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>
            ) : null}

            {plans.length === 0 ? (
              <div className={styles.stateBox}>
                <Layers className="mx-auto mb-2 h-8 w-8 text-zinc-400" aria-hidden />
                <p>No plans yet.</p>
                <p className="mt-1 text-sm text-zinc-500">
                  Create free, pro, and scale to match your pricing page.
                </p>
                <button type="button" onClick={openCreate} className={`${styles.primaryBtn} mt-4`}>
                  <Plus className="h-4 w-4" aria-hidden />
                  Create first plan
                </button>
              </div>
            ) : (
              <div className={styles.cardGrid}>
                {plans.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    selected={editingId === plan.id}
                    onSelect={() => openEdit(plan)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className={styles.editorRegion}>
            {editorOpen ? (
              <div className={styles.editorSticky}>
                <AdminPlanForm
                  mode={editorMode}
                  value={draft}
                  image={imageState}
                  onImageChange={setImageState}
                  catalog={taskCatalog}
                  onChange={setDraft}
                  saving={saving}
                  onSubmit={handleSubmit}
                  onCancel={closeEditor}
                  onDelete={editorMode === "edit" ? handleDelete : undefined}
                />
              </div>
            ) : (
              <div className={styles.emptyEditor}>
                <Pencil className="h-5 w-5 text-zinc-400" aria-hidden />
                <p className={styles.emptyEditorTitle}>Select a plan to edit</p>
                <p className={styles.emptyEditorHint}>
                  Click a plan card or use New plan to open the editor here.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
