"use client";

import { useCallback, useEffect, useId, useState } from "react";
import Link from "next/link";
import { BarChart3, Copy, Frame, KeyRound, Loader2, Lock, MessageCircle, Plus, X } from "lucide-react";

import { useFaqEmbedSettingsSubmit } from "@/app/forms/faqProjectCategories/useFaqEmbedSettingsSubmit";
import type { FaqProjectCategoriesLoadState } from "@/app/forms/faqProjectCategories/useFaqProjectCategoriesData";
import { resolveEmbedAccent } from "@/lib/embed-accent";
import { DEFAULT_APP_BADGE_LABEL } from "@/lib/embed-constants";
import { buildEmbedDemoUrl, parseDemoSiteUrl } from "@/lib/embed-demo";
import { EMBED_IFRAME_H, EMBED_IFRAME_W } from "@/lib/embed-iframe";
import { buildEmbedHostListenerScript, EMBED_LAUNCHER_ID, withEmbedWidgetParam } from "@/lib/embed-post-message";
import { getSiteOrigin } from "@/lib/site-metadata";
import { cn } from "@/lib/utils";

type Props = {
  apiKeyId: string;
  disabled?: boolean;
  faqLoad: Pick<FaqProjectCategoriesLoadState, "embed" | "refetch" | "loading">;
};

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

/** Bottom-right widget: launcher FAB (closed by default) + iframe opened on click. */
function buildIframeSnippet(pageUrl: string, accent: string): string {
  const safeSrc = escapeAttr(withEmbedWidgetParam(pageUrl));
  const launcherBg = resolveEmbedAccent(accent);
  return `<!-- SapAi embed widget -->
<button
  type="button"
  id="${EMBED_LAUNCHER_ID}"
  aria-label="Open assistant chat"
  style="position:fixed;bottom:20px;right:20px;z-index:2147483000;display:flex;align-items:center;justify-content:center;width:56px;height:56px;border:0;border-radius:9999px;background:${launcherBg};color:#fff;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,0.25)"
>
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"/></svg>
</button>
<iframe
  id="sapai-embed-widget"
  src="${safeSrc}"
  title="SapAi assistant"
  width="${EMBED_IFRAME_W}"
  height="${EMBED_IFRAME_H}"
  style="position:fixed;bottom:20px;right:20px;border:0;border-radius:16px;background:transparent;z-index:2147483000;box-shadow:0 8px 32px rgba(0,0,0,0.2);display:none"
  allow="clipboard-write"
></iframe>
${buildEmbedHostListenerScript()}`;
}

const MAX_EMBED_ALLOWED_ORIGINS = 20;
const HEX_EMBED_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

type EmbedSettingsTab = "setup" | "appearance" | "sharing";

function tryParseOriginInput(raw: string): { ok: true; origin: string } | { ok: false; message: string } {
  const s = raw.trim();
  if (!s) return { ok: false, message: "Enter an origin." };
  try {
    const url = new URL(s.includes("://") ? s : `https://${s}`);
    if (url.protocol === "https:") return { ok: true, origin: url.origin };
    if (url.protocol === "http:") {
      const h = url.hostname;
      if (h === "localhost" || h === "127.0.0.1" || h === "[::1]") return { ok: true, origin: url.origin };
    }
    return { ok: false, message: "Use https, or http on localhost only." };
  } catch {
    return { ok: false, message: "Invalid URL." };
  }
}

function EmbedWidgetPreview({
  accent,
  badgeLabel,
  profileUrl,
  showBadge,
}: {
  accent: string;
  badgeLabel: string;
  profileUrl: string | null;
  showBadge: boolean;
}) {
  const color = HEX_EMBED_COLOR.test(accent.trim()) ? accent.trim() : "#18181b";
  const avatar = profileUrl?.trim() || null;
  return (
    <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/60 p-3 lg:p-4" aria-hidden>
      <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-wide text-zinc-500 lg:text-left">
        Preview
      </p>
      <div className="relative mx-auto aspect-[5/7] w-full max-w-[12.5rem] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm lg:max-w-none">
        <div className="h-1 w-full" style={{ backgroundColor: color }} />
        <div className="border-b border-zinc-100 px-2.5 py-2">
          <div className="flex items-center gap-1.5">
            {avatar ? (
              <img
                src={avatar}
                alt=""
                className="h-6 w-6 shrink-0 rounded-full border border-zinc-200 object-cover ring-1 ring-white"
              />
            ) : (
              <div className="h-6 w-6 shrink-0 rounded-full" style={{ backgroundColor: color }} />
            )}
            <div className="h-2 w-14 rounded-full bg-zinc-200" />
          </div>
        </div>
        <div className="space-y-1.5 p-2">
          <div className="ml-auto h-5 w-12 rounded-lg rounded-br-sm opacity-90" style={{ backgroundColor: color }} />
          <div className="h-5 w-14 rounded-lg rounded-bl-sm bg-zinc-100" />
        </div>
        <div className="border-t border-zinc-100 px-2 py-1.5">
          <div className="h-4 rounded-md bg-zinc-100" />
          {showBadge && badgeLabel.trim() ? (
            <p className="mt-1 text-right text-[7px] font-medium leading-tight" style={{ color }}>
              {badgeLabel.trim()}
            </p>
          ) : null}
        </div>
        <div
          className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full text-white shadow-md"
          style={{ backgroundColor: color }}
        >
          <MessageCircle className="h-4 w-4" aria-hidden />
        </div>
      </div>
    </div>
  );
}

export function FaqRagEmbedSettingsCard({ apiKeyId, disabled = false, faqLoad }: Props) {
  const formId = useId();
  const { embed, refetch, loading } = faqLoad;
  const { patchEmbed, patchEmbedUi, uploadAssistantAvatar, saving, clearError } =
    useFaqEmbedSettingsSubmit(apiKeyId);
  const [copied, setCopied] = useState<"url" | "iframe" | "token" | "demo" | null>(null);
  const [tab, setTab] = useState<EmbedSettingsTab>("setup");
  const [originItems, setOriginItems] = useState<string[]>([]);
  const [originInput, setOriginInput] = useState("");
  const [originInputError, setOriginInputError] = useState("");
  const [demoSiteDraft, setDemoSiteDraft] = useState("");

  const serverOriginsKey = JSON.stringify(embed.allowedOrigins);
  useEffect(() => {
    setOriginItems([...embed.allowedOrigins]);
    setOriginInput("");
    setOriginInputError("");
  }, [serverOriginsKey]);

  const [nameDraft, setNameDraft] = useState("");
  const [greetDraft, setGreetDraft] = useState("");
  const [descDraft, setDescDraft] = useState("");
  const [colorDraft, setColorDraft] = useState("");
  const [badgeEnabledDraft, setBadgeEnabledDraft] = useState(true);
  const [badgeLabelDraft, setBadgeLabelDraft] = useState("");
  const [linkLabelDraft, setLinkLabelDraft] = useState("");
  const [linkUrlDraft, setLinkUrlDraft] = useState("");
  const [ragToneDraft, setRagToneDraft] = useState("");
  const [ragGuardrailsDraft, setRagGuardrailsDraft] = useState("");
  const embedUiKey = JSON.stringify({
    n: embed.assistantName,
    g: embed.assistantGreeting,
    d: embed.assistantDescription,
    c: embed.embedColor,
    p: embed.assistantProfileUrl,
    link: embed.furtherInfoLink,
    badgeOn: embed.appBadgeEnabled,
    badgeLabel: embed.appBadgeLabel,
    policy: embed.embedAppBadgePolicy,
    ragTone: embed.ragTone,
    ragGuardrails: embed.ragGuardrails,
    ragPromptEditable: embed.ragPromptEditable,
  });
  useEffect(() => {
    setNameDraft(embed.assistantName ?? "");
    setGreetDraft(embed.assistantGreeting ?? "");
    setDescDraft(embed.assistantDescription ?? "");
    setColorDraft(embed.embedColor ?? "");
    setBadgeEnabledDraft(embed.appBadgeEnabled ?? true);
    setBadgeLabelDraft(embed.appBadgeLabel ?? "");
    setLinkLabelDraft(embed.furtherInfoLink?.label ?? "");
    setLinkUrlDraft(embed.furtherInfoLink?.url ?? "");
    setRagToneDraft(embed.ragTone ?? "");
    setRagGuardrailsDraft(embed.ragGuardrails ?? "");
  }, [embedUiKey]);

  const origin = getSiteOrigin();
  const embedToken = embed.token?.trim() ? embed.token.trim() : null;
  const embedPathReal =
    embed.hasToken && embedToken ? `/embed/t/${encodeURIComponent(embedToken)}` : null;
  const fullPageUrlDisplay = embedPathReal ? `${origin}${embedPathReal}` : null;
  const iframeSnippetDisplay = fullPageUrlDisplay
    ? buildIframeSnippet(fullPageUrlDisplay, embed.embedColor ?? "")
    : "";

  const flashCopied = useCallback((kind: "url" | "iframe" | "token" | "demo") => {
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 2200);
  }, []);

  async function onToggleEnabled(next: boolean) {
    clearError();
    const r = await patchEmbed({ enabled: next });
    if (r.ok) void refetch();
  }

  async function onRotate() {
    clearError();
    const r = await patchEmbed({ rotate: true });
    if (r.ok) void refetch();
  }

  function tryAddOrigin(raw: string) {
    const parsed = tryParseOriginInput(raw);
    if (!parsed.ok) {
      setOriginInputError(parsed.message);
      return;
    }
    if (originItems.length >= MAX_EMBED_ALLOWED_ORIGINS) {
      setOriginInputError(`At most ${MAX_EMBED_ALLOWED_ORIGINS} origins.`);
      return;
    }
    if (originItems.includes(parsed.origin)) {
      setOriginInputError("That origin is already listed.");
      return;
    }
    setOriginItems((prev) => [...prev, parsed.origin]);
    setOriginInput("");
    setOriginInputError("");
    clearError();
  }

  function removeOriginAt(index: number) {
    setOriginItems((prev) => prev.filter((_, i) => i !== index));
    setOriginInputError("");
    clearError();
  }

  async function onSaveAllowedOrigins() {
    clearError();
    if (originItems.length > MAX_EMBED_ALLOWED_ORIGINS) return;
    const r = await patchEmbed({ allowedOrigins: originItems });
    if (r.ok) void refetch();
  }

  async function onSaveAppearance() {
    clearError();
    const color = colorDraft.trim();
    if (color && !HEX_EMBED_COLOR.test(color)) {
      return;
    }
    const label = linkLabelDraft.trim();
    const url = linkUrlDraft.trim();
    const furtherInfoLink =
      !label && !url
        ? null
        : { label: label || null, url: url || null };
    const patchBody: Parameters<typeof patchEmbedUi>[0] = {
      assistantName: nameDraft.trim() || null,
      assistantGreeting: greetDraft.trim() || null,
      assistantDescription: descDraft.trim() || null,
      embedColor: color ? color : null,
      furtherInfoLink,
    };
    if (embed.embedAppBadgePolicy === "customizable") {
      patchBody.appBadge = {
        enabled: badgeEnabledDraft,
        label: badgeLabelDraft.trim() || null,
      };
      if (badgeEnabledDraft) {
        patchBody.aiDisclaimer = null;
      }
      if (embed.ragPromptEditable) {
        patchBody.ragTone = ragToneDraft.trim() || null;
        patchBody.ragGuardrails = ragGuardrailsDraft.trim() || null;
      }
    }
    const r = await patchEmbedUi(patchBody);
    if (r.ok) void refetch();
  }

  async function onClearAvatar() {
    clearError();
    const r = await patchEmbedUi({ clearAssistantAvatar: true });
    if (r.ok) void refetch();
  }

  async function onAvatarFile(file: File) {
    clearError();
    const r = await uploadAssistantAvatar(file);
    if (r.ok) void refetch();
  }

  function copyText(label: "url" | "iframe" | "token" | "demo", text: string) {
    void navigator.clipboard.writeText(text).then(() => flashCopied(label));
  }

  const hasRealEmbedUrl = Boolean(embedPathReal);
  const blocked = disabled || loading || saving;
  const showEmbedExamples = embed.hasToken;

  const chipWrapClass =
    "flex min-h-[2.75rem] flex-wrap items-center gap-2 rounded-lg border border-zinc-200/80 bg-zinc-50/30 px-2 py-2 focus-within:border-zinc-300 focus-within:bg-zinc-50/60 focus-within:ring-1 focus-within:ring-zinc-200/60";
  const chipClass =
    "inline-flex max-w-full items-center gap-1 rounded-full bg-zinc-100/90 pl-2.5 pr-1 py-0.5 text-xs font-medium text-zinc-800 ring-1 ring-zinc-200/60";

  const tabIds: { id: EmbedSettingsTab; label: string }[] = [
    { id: "setup", label: "Setup" },
    { id: "appearance", label: "Widget look" },
    { id: "sharing", label: "Sites & copy" },
  ];

  const originInputId = `${formId}-origin-add`;
  const demoSiteParsed = demoSiteDraft.trim() ? parseDemoSiteUrl(demoSiteDraft) : null;
  const embedDemoUrl =
    demoSiteParsed?.ok && embedToken && embed.enabled
      ? buildEmbedDemoUrl(demoSiteParsed.url, embedToken, origin)
      : null;
  const previewAccent = colorDraft.trim() || embed.embedColor?.trim() || "#18181b";
  const previewBadgeLabel =
    embed.embedAppBadgePolicy === "required"
      ? DEFAULT_APP_BADGE_LABEL
      : badgeLabelDraft.trim() || DEFAULT_APP_BADGE_LABEL;
  const previewShowBadge =
    embed.embedAppBadgePolicy === "required" ||
    (embed.embedAppBadgePolicy === "customizable" && badgeEnabledDraft);

  if (!loading && !embed.embedPlanEligible) {
    return (
      <section
        className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm"
        aria-labelledby="faq-embed-upsell-heading"
      >
        <div className="absolute left-0 top-0 h-full w-1 bg-zinc-900" aria-hidden />
        <div className="pl-5 pr-4 py-5 sm:pl-6 sm:pr-5 sm:py-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-3">
                <span
                  className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md border-2 border-zinc-900 bg-zinc-950 text-white shadow-sm"
                  aria-hidden
                >
                  <Lock className="h-[18px] w-[18px]" strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <h2 id="faq-embed-upsell-heading" className="text-lg font-semibold tracking-tight text-zinc-950">
                    Public embed
                  </h2>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Plan upgrade</p>
                </div>
              </div>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-600">
                intergrate your chat bot easily with iframe
              </p>
              <ul className="mt-4 grid gap-2.5 text-sm text-zinc-700 sm:grid-cols-2">
                {[
                  "Embeddable via iframe snippet",
                  "Assistant branding, greeting, and live preview",
                ].map((text) => (
                  <li key={text} className="border-l-2 border-zinc-900 pl-3 text-sm leading-snug text-zinc-700">
                    {text}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex w-full shrink-0 flex-col gap-3 lg:w-[min(100%,240px)] lg:pt-1">
              <Link
                href="/pricing"
                className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-zinc-950 px-5 py-3.5 text-center text-sm font-semibold text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_10px_28px_-12px_rgba(0,0,0,0.55)] ring-1 ring-zinc-950 transition hover:bg-black hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.14),0_14px_36px_-12px_rgba(0,0,0,0.65)] hover:ring-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950 active:scale-[0.99]"
              >
                <span className="relative z-10">View plans and upgrade</span>
                <BarChart3
                  className="relative z-10 h-4 w-4 opacity-90 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
              <p className="text-center text-[11px] leading-snug text-zinc-500 lg:text-left">
                Unlocks on this FAQ step after upgrade. You can still manage knowledge files and categories on Free.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section
        className="rounded-xl border border-zinc-200/90 bg-white p-5 shadow-sm sm:p-6"
        aria-busy="true"
        aria-label="Loading embed settings"
      >
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-zinc-600">
          <Loader2 className="h-5 w-5 animate-spin text-zinc-500" aria-hidden />
          Loading embed settings…
        </div>
      </section>
    );
  }

  return (
    <section
      className="rounded-xl border border-zinc-200/90 bg-white shadow-sm"
      aria-labelledby="faq-embed-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
            <Frame className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 id="faq-embed-heading" className="text-base font-semibold tracking-tight text-zinc-900">
              Public embed
            </h2>
            <p className="mt-0.5 text-sm text-zinc-600">
              Iframe widget · uses an{" "}
              <span className="font-medium text-zinc-800">embed token</span>, not your API key.{" "}
              <Link href="/docs/api/guides/embed" className="text-sky-800 hover:underline">
                Guide
              </Link>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5" aria-live="polite">
          <span
            className={cn(
              "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
              embed.hasToken ? "bg-sky-50 text-sky-900 ring-1 ring-sky-100" : "bg-zinc-100 text-zinc-500",
            )}
          >
            {embed.hasToken ? "Token ready" : "No token"}
          </span>
          <span
            className={cn(
              "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
              embed.enabled ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-100" : "bg-zinc-100 text-zinc-500",
            )}
          >
            {embed.enabled ? "Live" : "Off"}
          </span>
        </div>
      </div>

      <div className="border-b border-zinc-200 px-5 sm:px-6" role="tablist" aria-label="Embed settings sections">
        <div className="-mb-px flex gap-4">
          {tabIds.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              id={`faq-embed-tab-${id}`}
              aria-controls={`faq-embed-panel-${id}`}
              onClick={() => setTab(id)}
              className={cn(
                "relative min-w-0 border-b-2 px-0.5 pb-2.5 pt-1 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sky-400/80 focus-visible:ring-offset-2 rounded-t",
                tab === id
                  ? "border-sky-600 font-semibold text-zinc-900"
                  : "border-transparent font-medium text-zinc-500 hover:text-zinc-800",
              )}
            >
              <span className="whitespace-nowrap">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pb-5 pt-4 text-sm text-zinc-700 sm:px-6 sm:pb-6">
          {tab === "setup" ? (
            <div
              role="tabpanel"
              id="faq-embed-panel-setup"
              aria-labelledby="faq-embed-tab-setup"
              className="space-y-4"
            >
              <div className="rounded-lg border border-zinc-200/80 bg-zinc-50/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">Embed token</p>
                    <p className="mt-0.5 text-xs text-zinc-600">Rotate to revoke old site links.</p>
                  </div>
                  <button
                    type="button"
                    disabled={blocked}
                    onClick={() => void onRotate()}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <KeyRound className="h-4 w-4" aria-hidden />
                    )}
                    {embed.hasToken ? "Rotate token" : "Generate token"}
                  </button>
                </div>
                <label className="mt-4 flex cursor-pointer select-none items-center gap-2.5 border-t border-zinc-200/80 pt-4 text-sm text-zinc-800">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400"
                    checked={embed.enabled}
                    disabled={blocked || !embed.hasToken}
                    onChange={(e) => void onToggleEnabled(e.target.checked)}
                  />
                  <span>
                    <span className="font-medium">Embed active</span>
                    <span className="mt-0.5 block text-xs font-normal text-zinc-500">
                      {embed.hasToken ? "Visitors can use the widget while this is on." : "Generate a token first."}
                    </span>
                  </span>
                </label>
              </div>
            </div>
          ) : null}

          {tab === "appearance" ? (
            <div
              role="tabpanel"
              id="faq-embed-panel-appearance"
              aria-labelledby="faq-embed-tab-appearance"
            >
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_13rem] lg:items-start">
                <div className="order-2 space-y-4 lg:order-1">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label htmlFor="faq-embed-assistant-name" className="text-xs font-medium text-zinc-800">
                        Assistant name
                      </label>
                      <input
                        id="faq-embed-assistant-name"
                        type="text"
                        maxLength={80}
                        value={nameDraft}
                        onChange={(e) => setNameDraft(e.target.value)}
                        disabled={blocked}
                        className="mt-1 w-full rounded-lg border border-zinc-200/90 bg-zinc-50/40 px-2.5 py-1.5 text-sm text-zinc-900 transition-colors focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-200/80 disabled:opacity-50"
                        placeholder="Assistant"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="faq-embed-color" className="text-xs font-medium text-zinc-800">
                        Accent color
                      </label>
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          id="faq-embed-color"
                          type="color"
                          value={HEX_EMBED_COLOR.test(colorDraft) ? colorDraft : "#18181b"}
                          onChange={(e) => setColorDraft(e.target.value)}
                          disabled={blocked}
                          className="h-9 w-12 cursor-pointer rounded border border-zinc-200 bg-white disabled:opacity-50"
                          aria-label="Pick accent color"
                        />
                        <input
                          type="text"
                          maxLength={12}
                          value={colorDraft}
                          onChange={(e) => setColorDraft(e.target.value)}
                          disabled={blocked}
                          className="w-28 rounded-lg border border-zinc-200/90 bg-zinc-50/40 px-2 py-1.5 font-mono text-xs text-zinc-900 transition-colors focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-200/80 disabled:opacity-50"
                          placeholder="#18181b"
                        />
                      </div>
                      {colorDraft.trim() && !HEX_EMBED_COLOR.test(colorDraft.trim()) ? (
                        <p className="mt-1 text-[11px] text-amber-800">Use #RGB, #RRGGBB, or #RRGGBBAA.</p>
                      ) : null}
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="faq-embed-greeting" className="text-xs font-medium text-zinc-800">
                        First-open greeting
                      </label>
                      <textarea
                        id="faq-embed-greeting"
                        rows={2}
                        maxLength={1000}
                        value={greetDraft}
                        onChange={(e) => setGreetDraft(e.target.value)}
                        disabled={blocked}
                        className="mt-1 w-full resize-y rounded-lg border border-zinc-200/90 bg-zinc-50/40 px-2.5 py-1.5 text-sm text-zinc-900 transition-colors focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-200/80 disabled:opacity-50"
                        placeholder="Shown once when chat opens…"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="faq-embed-description" className="text-xs font-medium text-zinc-800">
                        Description (avatar tap)
                      </label>
                      <textarea
                        id="faq-embed-description"
                        rows={2}
                        maxLength={2000}
                        value={descDraft}
                        onChange={(e) => setDescDraft(e.target.value)}
                        disabled={blocked}
                        className="mt-1 w-full resize-y rounded-lg border border-zinc-200/90 bg-zinc-50/40 px-2.5 py-1.5 text-sm text-zinc-900 transition-colors focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-200/80 disabled:opacity-50"
                        placeholder="Short intro…"
                      />
                    </div>
                  </div>

                  {embed.ragPromptEditable ? (
                    <div className="rounded-lg border border-zinc-200/80 bg-zinc-50/30 p-3 space-y-3">
                      <div>
                        <p className="text-xs font-medium text-zinc-800">Assistant behavior (RAG)</p>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">
                          Applies to RAG answers for this project (API, embed, and dashboard tester). Chat jobs
                          always use platform defaults.
                        </p>
                      </div>
                      <div>
                        <label htmlFor="faq-embed-rag-tone" className="text-xs font-medium text-zinc-800">
                          Tone
                        </label>
                        <textarea
                          id="faq-embed-rag-tone"
                          rows={2}
                          maxLength={1000}
                          value={ragToneDraft}
                          onChange={(e) => setRagToneDraft(e.target.value)}
                          disabled={blocked}
                          className="mt-1 w-full resize-y rounded-lg border border-zinc-200/90 bg-zinc-50/40 px-2.5 py-1.5 text-sm text-zinc-900 transition-colors focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-200/80 disabled:opacity-50"
                          placeholder="Friendly and concise. Use we/our. No jargon."
                        />
                      </div>
                      <div>
                        <label htmlFor="faq-embed-rag-guardrails" className="text-xs font-medium text-zinc-800">
                          Guardrails
                        </label>
                        <textarea
                          id="faq-embed-rag-guardrails"
                          rows={4}
                          maxLength={2000}
                          value={ragGuardrailsDraft}
                          onChange={(e) => setRagGuardrailsDraft(e.target.value)}
                          disabled={blocked}
                          className="mt-1 w-full resize-y rounded-lg border border-zinc-200/90 bg-zinc-50/40 px-2.5 py-1.5 text-sm text-zinc-900 transition-colors focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-200/80 disabled:opacity-50"
                          placeholder="Leave blank to use SapAi defaults."
                        />
                      </div>
                    </div>
                  ) : embed.embedPlanEligible ? (
                    <p className="text-[11px] leading-relaxed text-zinc-500">
                      Upgrade to Scale to customize RAG tone and guardrails.
                    </p>
                  ) : null}

                  <div className="rounded-lg border border-zinc-200/80 bg-zinc-50/30 p-3 space-y-3">
                    <p className="text-xs font-medium text-zinc-800">Profile picture</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml"
                        disabled={blocked}
                        className="max-w-full text-[11px] file:mr-2 file:rounded file:border-0 file:bg-zinc-200 file:px-2 file:py-1 file:text-xs file:font-medium file:text-zinc-800"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          e.target.value = "";
                          if (f) void onAvatarFile(f);
                        }}
                      />
                      {embed.assistantProfileUrl ? (
                        <>
                          <img
                            src={embed.assistantProfileUrl}
                            alt=""
                            className="h-9 w-9 rounded-full border border-zinc-200 object-cover"
                          />
                          <button
                            type="button"
                            disabled={blocked}
                            onClick={() => void onClearAvatar()}
                            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>

                  {embed.embedAppBadgePolicy === "required" ? (
                    <p className="text-[11px] leading-relaxed text-zinc-500">
                      Pro: fixed badge &ldquo;{DEFAULT_APP_BADGE_LABEL}&rdquo; on the widget.
                    </p>
                  ) : null}
                  {embed.embedAppBadgePolicy === "customizable" ? (
                    <div className="rounded-lg border border-zinc-200/80 bg-zinc-50/30 p-3 space-y-2">
                      <label className="inline-flex cursor-pointer select-none items-center gap-2 text-sm font-medium text-zinc-800">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400"
                          checked={badgeEnabledDraft}
                          disabled={blocked}
                          onChange={(e) => setBadgeEnabledDraft(e.target.checked)}
                        />
                        Show app badge
                      </label>
                      {badgeEnabledDraft ? (
                        <div>
                          <label htmlFor="faq-embed-badge-label" className="text-[11px] font-medium text-zinc-700">
                            Badge text
                          </label>
                          <input
                            id="faq-embed-badge-label"
                            type="text"
                            maxLength={80}
                            value={badgeLabelDraft}
                            onChange={(e) => setBadgeLabelDraft(e.target.value)}
                            disabled={blocked}
                            className="mt-1 w-full rounded-lg border border-zinc-200/90 bg-white px-2.5 py-1.5 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200/80 disabled:opacity-50"
                            placeholder={DEFAULT_APP_BADGE_LABEL}
                          />
                        </div>
                      ) : (
                        <p className="text-[11px] text-zinc-500">Badge off — default AI disclaimer shows instead.</p>
                      )}
                    </div>
                  ) : null}

                  <details className="rounded-lg border border-zinc-200/80 bg-zinc-50/20 open:bg-white">
                    <summary className="cursor-pointer select-none px-3 py-2 text-xs font-medium text-zinc-800">
                      Further information link (optional)
                    </summary>
                    <div className="space-y-2 border-t border-zinc-200/80 p-3 pt-2">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <input
                          id="faq-embed-link-label"
                          type="text"
                          maxLength={80}
                          value={linkLabelDraft}
                          onChange={(e) => setLinkLabelDraft(e.target.value)}
                          disabled={blocked}
                          className="rounded-lg border border-zinc-200/90 bg-white px-2.5 py-1.5 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200/80 disabled:opacity-50"
                          placeholder="Link label"
                          aria-label="Link label"
                        />
                        <input
                          id="faq-embed-link-url"
                          type="url"
                          maxLength={2048}
                          value={linkUrlDraft}
                          onChange={(e) => setLinkUrlDraft(e.target.value)}
                          disabled={blocked}
                          className="rounded-lg border border-zinc-200/90 bg-white px-2.5 py-1.5 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200/80 disabled:opacity-50"
                          placeholder="https://…"
                          aria-label="Link URL"
                        />
                      </div>
                      {Boolean(linkLabelDraft.trim()) !== Boolean(linkUrlDraft.trim()) ? (
                        <p className="text-[11px] text-amber-800">Enter both label and URL, or clear both.</p>
                      ) : null}
                    </div>
                  </details>

                  <button
                    type="button"
                    disabled={
                      blocked ||
                      Boolean(colorDraft.trim() && !HEX_EMBED_COLOR.test(colorDraft.trim())) ||
                      Boolean(linkLabelDraft.trim()) !== Boolean(linkUrlDraft.trim())
                    }
                    onClick={() => void onSaveAppearance()}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                    Save appearance
                  </button>
                </div>

                <div className="order-1 flex justify-center lg:order-2 lg:sticky lg:top-4 lg:self-start lg:justify-start">
                  <EmbedWidgetPreview
                    accent={previewAccent}
                    badgeLabel={previewBadgeLabel}
                    profileUrl={embed.assistantProfileUrl}
                    showBadge={previewShowBadge}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {tab === "sharing" ? (
            <div
              role="tabpanel"
              id="faq-embed-panel-sharing"
              aria-labelledby="faq-embed-tab-sharing"
              className="space-y-4"
            >
              {!embed.hasToken ? (
                <p className="text-xs text-zinc-600">Generate a token on <strong>Setup</strong> first.</p>
              ) : !embed.enabled ? (
                <p className="text-xs text-zinc-600">Turn on <strong>Embed active</strong> on Setup for live preview.</p>
              ) : null}

              <div>
                <p className="text-xs font-medium text-zinc-800">Allowed parent origins</p>
                <p id={`${formId}-origins-hint`} className="mt-0.5 text-[11px] text-zinc-500">
                  Empty = only this app. Max {MAX_EMBED_ALLOWED_ORIGINS}. Enter or comma to add.
                </p>
                <label className="sr-only" htmlFor={originInputId}>
                  Add allowed parent origin
                </label>
                <div className="mt-2" role="list" aria-label="Allowed iframe parent origins">
                  <div className={chipWrapClass}>
                    {originItems.map((o, index) => (
                      <span key={`${o}-${index}`} role="listitem" className={chipClass}>
                        <span className="max-w-[min(20rem,100%)] truncate font-mono text-[11px]" title={o}>
                          {o}
                        </span>
                        <button
                          type="button"
                          className="rounded-full p-0.5 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-zinc-500 disabled:opacity-40"
                          aria-label={`Remove ${o}`}
                          disabled={blocked}
                          onClick={() => removeOriginAt(index)}
                        >
                          <X className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        </button>
                      </span>
                    ))}
                    <input
                      id={originInputId}
                      type="text"
                      className="min-w-[8rem] flex-1 border-0 bg-transparent py-1 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 disabled:opacity-50"
                      value={originInput}
                      onChange={(e) => {
                        setOriginInput(e.target.value);
                        setOriginInputError("");
                        clearError();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault();
                          tryAddOrigin(originInput);
                          return;
                        }
                        if (e.key === "Backspace" && originInput === "" && originItems.length > 0) {
                          e.preventDefault();
                          removeOriginAt(originItems.length - 1);
                        }
                      }}
                      disabled={blocked}
                      placeholder={
                        originItems.length === 0 ? "https://example.com then Enter…" : "Add another origin…"
                      }
                      spellCheck={false}
                      autoComplete="off"
                      aria-describedby={`${formId}-origins-hint`}
                    />
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={blocked || !originInput.trim()}
                    onClick={() => tryAddOrigin(originInput)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-zinc-100 disabled:opacity-50"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden />
                    Add origin
                  </button>
                  <button
                    type="button"
                    disabled={blocked}
                    onClick={() => void onSaveAllowedOrigins()}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-sky-300 bg-white px-3 py-1.5 text-xs font-semibold text-sky-900 shadow-sm transition hover:bg-sky-50 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : null}
                    Save origins
                  </button>
                  <span className="text-[11px] text-zinc-500">
                    {originItems.length} / {MAX_EMBED_ALLOWED_ORIGINS} · Enter or comma adds
                  </span>
                </div>
                {originInputError ? (
                  <p className="mt-2 text-xs text-amber-800" role="status">
                    {originInputError}
                  </p>
                ) : null}
              </div>

              {showEmbedExamples && embedToken && embed.enabled ? (
                <details className="group overflow-hidden rounded-lg border border-zinc-200/70 bg-zinc-50/30 open:border-zinc-200 open:bg-white">
                  <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium text-zinc-800 marker:text-zinc-400">
                    Live preview
                  </summary>
                  <iframe
                    title="Embed preview"
                    src={`/embed/t/${encodeURIComponent(embedToken)}`}
                    className="h-[min(28rem,70vh)] w-full border-0 border-t border-zinc-200/60 bg-white"
                  />
                </details>
              ) : showEmbedExamples && embedToken && !embed.enabled ? (
                <p className="rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-xs leading-relaxed text-amber-950">
                  Turn on <strong>Embed active</strong> on the Setup tab to load the preview here.
                </p>
              ) : null}

              {showEmbedExamples && embedToken && embed.enabled ? (
                <details className="group rounded-lg border border-zinc-200/70 bg-zinc-50/20 open:border-zinc-200 open:bg-white">
                  <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium text-zinc-800 marker:text-zinc-400">
                    Client site demo
                  </summary>
                  <div className="space-y-2 border-t border-zinc-200/80 p-3 pt-2">
                    <p className="text-[11px] leading-relaxed text-zinc-600">
                      Enter the client&apos;s site URL to get a shareable demo: their page in the background, your chat
                      widget on top. Some sites block embedding.
                    </p>
                    <label htmlFor={`${formId}-demo-site`} className="sr-only">
                      Client website URL for demo
                    </label>
                    <input
                      id={`${formId}-demo-site`}
                      type="url"
                      value={demoSiteDraft}
                      onChange={(e) => setDemoSiteDraft(e.target.value)}
                      disabled={blocked}
                      placeholder="https://example.com"
                      className="w-full rounded-lg border border-zinc-200/90 bg-white px-2.5 py-1.5 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200/80 disabled:opacity-50"
                    />
                    {demoSiteDraft.trim() && demoSiteParsed && !demoSiteParsed.ok ? (
                      <p className="text-[11px] text-amber-800">{demoSiteParsed.message}</p>
                    ) : null}
                    {embedDemoUrl ? (
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                        <input
                          readOnly
                          className="min-w-0 flex-1 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-2 font-mono text-[11px] text-zinc-900"
                          value={embedDemoUrl}
                          aria-label="Shareable demo link"
                        />
                        <button
                          type="button"
                          onClick={() => copyText("demo", embedDemoUrl)}
                          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
                        >
                          <Copy className="h-3.5 w-3.5" aria-hidden />
                          {copied === "demo" ? "Copied" : "Copy demo link"}
                        </button>
                      </div>
                    ) : null}
                    {embedDemoUrl ? (
                      <Link
                        href={embedDemoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block text-xs font-medium text-sky-800 hover:underline"
                      >
                        Open demo in new tab
                      </Link>
                    ) : null}
                  </div>
                </details>
              ) : null}

              {showEmbedExamples && fullPageUrlDisplay ? (
                <details className="group rounded-lg border border-zinc-200/70 bg-zinc-50/20 open:border-zinc-200 open:bg-white">
                  <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium text-zinc-800 marker:text-zinc-400">
                    Copy embed URL, token, or iframe HTML
                  </summary>
                  <div className="space-y-3 border-t border-zinc-200/80 p-3 pt-3">
                    <p className="text-[11px] leading-relaxed text-zinc-600">
                      Paste the snippet on your site: visitors see a <strong>chat button</strong> first; the panel opens on
                      click and closes back to the button.
                    </p>
                    {embedToken ? (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Embed token</p>
                        <p className="mt-0.5 text-[10px] leading-snug text-zinc-500">
                          Same value visitors send from the widget; rotate on Setup if a site should lose access.
                        </p>
                        <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-stretch">
                          <input
                            readOnly
                            className="min-w-0 flex-1 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-2 font-mono text-[11px] text-zinc-900"
                            value={embedToken}
                            aria-label="Embed token"
                          />
                          <button
                            type="button"
                            onClick={() => copyText("token", embedToken)}
                            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
                          >
                            <Copy className="h-3.5 w-3.5" aria-hidden />
                            {copied === "token" ? "Copied" : "Copy token"}
                          </button>
                        </div>
                      </div>
                    ) : null}

                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Embed page URL</p>
                      <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-stretch">
                        <input
                          readOnly
                          className="min-w-0 flex-1 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-2 font-mono text-[11px] text-zinc-900"
                          value={fullPageUrlDisplay}
                          aria-label="Embed page URL"
                        />
                        <button
                          type="button"
                          onClick={() => copyText("url", fullPageUrlDisplay)}
                          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
                        >
                          <Copy className="h-3.5 w-3.5" aria-hidden />
                          {copied === "url" ? "Copied" : "Copy URL"}
                        </button>
                      </div>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Iframe HTML</p>
                      <div className="relative mt-1">
                        <pre className="max-h-36 overflow-auto rounded-md border border-zinc-200 bg-zinc-900 p-2 pr-10 font-mono text-[10px] leading-snug text-zinc-100">
                          {iframeSnippetDisplay}
                        </pre>
                        <button
                          type="button"
                          onClick={() => copyText("iframe", iframeSnippetDisplay)}
                          className="absolute right-1.5 top-1.5 rounded-md border border-zinc-600 bg-zinc-800 p-1.5 text-zinc-200 hover:bg-zinc-700"
                          aria-label="Copy iframe HTML"
                        >
                          <Copy className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      </div>
                      <p className="mt-1 text-[10px] text-zinc-500">
                        {copied === "iframe" ? "Copied." : "Paste into your site where you want the chat."}
                      </p>
                    </div>
                  </div>
                </details>
              ) : null}

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-zinc-100 pt-3">
                {hasRealEmbedUrl && embedPathReal ? (
                  <Link
                    href={embedPathReal}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-sky-800 underline-offset-2 hover:underline"
                  >
                    Open embed page (new tab)
                  </Link>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
    </section>
  );
}
