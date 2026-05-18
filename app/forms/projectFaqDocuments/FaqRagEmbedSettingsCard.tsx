"use client";

import { useCallback, useEffect, useId, useState } from "react";
import Link from "next/link";
import { BarChart3, Copy, Frame, KeyRound, Loader2, Lock, Plus, X } from "lucide-react";

import { useFaqEmbedSettingsSubmit } from "@/app/forms/faqProjectCategories/useFaqEmbedSettingsSubmit";
import type { FaqProjectCategoriesLoadState } from "@/app/forms/faqProjectCategories/useFaqProjectCategoriesData";
import { DEFAULT_APP_BADGE_LABEL } from "@/lib/embed-badge";
import { DEFAULT_EMBED_AI_DISCLAIMER } from "@/lib/embed-disclaimer";
import { EMBED_IFRAME_H, EMBED_IFRAME_W } from "@/lib/embed-iframe";
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

/** Fixed-size bottom-right iframe widget (no FAB / resize script). */
function buildIframeSnippet(pageUrl: string): string {
  const safeSrc = escapeAttr(pageUrl);
  return `<!-- SapAi embed widget -->
<iframe
  id="sapai-embed-widget"
  src="${safeSrc}"
  title="SapAi assistant"
  width="${EMBED_IFRAME_W}"
  height="${EMBED_IFRAME_H}"
  style="position:fixed;bottom:20px;right:20px;border:0;border-radius:16px;background:transparent;z-index:2147483000;box-shadow:0 8px 32px rgba(0,0,0,0.2)"
  allow="clipboard-write"
></iframe>`;
}

const MAX_EMBED_ALLOWED_ORIGINS = 20;

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

export function FaqRagEmbedSettingsCard({ apiKeyId, disabled = false, faqLoad }: Props) {
  const formId = useId();
  const { embed, refetch, loading } = faqLoad;
  const { patchEmbed, patchEmbedUi, uploadAssistantAvatar, saving, clearError } =
    useFaqEmbedSettingsSubmit(apiKeyId);
  const [copied, setCopied] = useState<"url" | "iframe" | "token" | null>(null);
  const [tab, setTab] = useState<EmbedSettingsTab>("setup");
  const [originItems, setOriginItems] = useState<string[]>([]);
  const [originInput, setOriginInput] = useState("");
  const [originInputError, setOriginInputError] = useState("");

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
  const [disclaimerDraft, setDisclaimerDraft] = useState("");
  const [badgeEnabledDraft, setBadgeEnabledDraft] = useState(true);
  const [badgeLabelDraft, setBadgeLabelDraft] = useState("");
  const [linkLabelDraft, setLinkLabelDraft] = useState("");
  const [linkUrlDraft, setLinkUrlDraft] = useState("");
  const embedUiKey = JSON.stringify({
    n: embed.assistantName,
    g: embed.assistantGreeting,
    d: embed.assistantDescription,
    c: embed.embedColor,
    p: embed.assistantProfileUrl,
    disc: embed.aiDisclaimer,
    link: embed.furtherInfoLink,
    badgeOn: embed.appBadgeEnabled,
    badgeLabel: embed.appBadgeLabel,
    policy: embed.embedAppBadgePolicy,
  });
  useEffect(() => {
    setNameDraft(embed.assistantName ?? "");
    setGreetDraft(embed.assistantGreeting ?? "");
    setDescDraft(embed.assistantDescription ?? "");
    setColorDraft(embed.embedColor ?? "");
    setDisclaimerDraft(embed.aiDisclaimer ?? "");
    setBadgeEnabledDraft(embed.appBadgeEnabled ?? true);
    setBadgeLabelDraft(embed.appBadgeLabel ?? "");
    setLinkLabelDraft(embed.furtherInfoLink?.label ?? "");
    setLinkUrlDraft(embed.furtherInfoLink?.url ?? "");
  }, [embedUiKey]);

  const origin = getSiteOrigin();
  const embedToken = embed.token?.trim() ? embed.token.trim() : null;
  const embedPathReal =
    embed.hasToken && embedToken ? `/embed/t/${encodeURIComponent(embedToken)}` : null;
  const fullPageUrlDisplay = embedPathReal ? `${origin}${embedPathReal}` : null;
  const iframeSnippetDisplay = fullPageUrlDisplay ? buildIframeSnippet(fullPageUrlDisplay) : "";

  const flashCopied = useCallback((kind: "url" | "iframe" | "token") => {
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

  const HEX_EMBED_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

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
        patchBody.aiDisclaimer = disclaimerDraft.trim() || null;
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

  function copyText(label: "url" | "iframe" | "token", text: string) {
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
      className="rounded-xl border border-zinc-200/90 bg-white p-5 shadow-sm sm:p-6"
      aria-labelledby="faq-embed-heading"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
          <Frame className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="faq-embed-heading" className="text-lg font-semibold tracking-tight text-zinc-900">
            Public embed (website / iframe)
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-zinc-600">
            An <span className="font-medium text-zinc-800">embed token</span> scopes the widget to this project. It ends
            up in the embed URL and browser requests (
            <code className="rounded bg-zinc-100 px-1 font-mono text-[11px] text-zinc-800">
              x-embed-token
            </code>
            ) — that is expected for a public embed. It is <span className="font-medium">not</span> your{" "}
            <code className="font-mono text-[11px]">sapai_sk_</code> server key. You can copy the token anytime from this
            page while signed in; rotate to revoke old links.
          </p>
          <p className="mt-2 text-sm">
            <Link
              href="/docs/api/guides/embed"
              className="font-medium text-sky-800 underline-offset-2 hover:underline"
            >
              Step-by-step guide (where to click, profile picture, tabs)
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-5" aria-live="polite">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide",
            embed.hasToken ? "bg-sky-50 text-sky-900 ring-1 ring-sky-100" : "bg-zinc-100 text-zinc-500",
          )}
        >
          {embed.hasToken ? "Token saved" : "No token"}
        </span>
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide",
            embed.enabled ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-100" : "bg-zinc-100 text-zinc-500",
          )}
        >
          {embed.enabled ? "Embed on" : "Embed off"}
        </span>
      </div>

      <div className="mt-5 border-b border-zinc-200" role="tablist" aria-label="Embed settings sections">
        <div className="-mb-px flex gap-1 sm:gap-6">
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

      <div className="pt-5 text-sm text-zinc-700">
          {tab === "setup" ? (
            <div
              role="tabpanel"
              id="faq-embed-panel-setup"
              aria-labelledby="faq-embed-tab-setup"
              className="space-y-5"
            >
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Token</p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-600">
                  Stored on the server for this project. Rotate when a partner or site should lose access.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={blocked}
                    onClick={() => void onRotate()}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-sky-300 bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <KeyRound className="h-4 w-4" aria-hidden />
                    )}
                    {embed.hasToken ? "Rotate token" : "Generate token"}
                  </button>
                </div>
              </div>

              <div className="border-t border-zinc-100 pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Availability</p>
                <p className="mt-1 text-xs text-zinc-600">Visitors can only use the widget while this is on.</p>
                <label className="mt-3 inline-flex cursor-pointer select-none items-center gap-2 text-sm font-medium text-zinc-800">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-zinc-300 text-sky-700 focus:ring-sky-500"
                    checked={embed.enabled}
                    disabled={blocked || !embed.hasToken}
                    onChange={(e) => void onToggleEnabled(e.target.checked)}
                  />
                  Embed active
                </label>
                {!embed.hasToken ? (
                  <p className="mt-2 text-xs text-amber-800">Generate a token first.</p>
                ) : null}
              </div>
            </div>
          ) : null}

          {tab === "appearance" ? (
            <div
              role="tabpanel"
              id="faq-embed-panel-appearance"
              aria-labelledby="faq-embed-tab-appearance"
              className="space-y-3"
            >
              <p className="text-xs leading-relaxed text-zinc-600">
                Name, greeting, and accent show in the public widget. Greeting appears once when chat opens. Optional
                photo; visitors tap it to read the description.
              </p>
              <div className="space-y-3">
                <div>
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
                <div>
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
                    placeholder="Shown once when the chat opens…"
                  />
                </div>
                <div>
                  <label htmlFor="faq-embed-description" className="text-xs font-medium text-zinc-800">
                    Description (when avatar is tapped)
                  </label>
                  <textarea
                    id="faq-embed-description"
                    rows={3}
                    maxLength={2000}
                    value={descDraft}
                    onChange={(e) => setDescDraft(e.target.value)}
                    disabled={blocked}
                    className="mt-1 w-full resize-y rounded-lg border border-zinc-200/90 bg-zinc-50/40 px-2.5 py-1.5 text-sm text-zinc-900 transition-colors focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-200/80 disabled:opacity-50"
                    placeholder="Short intro about the assistant…"
                  />
                </div>
                {embed.embedAppBadgePolicy === "required" ? (
                  <div className="border-t border-zinc-100 pt-3">
                    <p className="text-xs font-medium text-zinc-800">App badge &amp; disclaimer</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
                      Pro plans always show &ldquo;{DEFAULT_APP_BADGE_LABEL}&rdquo; on the widget. The AI disclaimer
                      is fixed: &ldquo;{DEFAULT_EMBED_AI_DISCLAIMER}&rdquo;
                    </p>
                  </div>
                ) : null}
                {embed.embedAppBadgePolicy === "customizable" ? (
                  <div className="border-t border-zinc-100 pt-3 space-y-3">
                    <div>
                      <p className="text-xs font-medium text-zinc-800">App badge</p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">
                        Show branding on the public widget. Disclaimer customization is only available when the badge is
                        on.
                      </p>
                      <label className="mt-2 inline-flex cursor-pointer select-none items-center gap-2 text-sm font-medium text-zinc-800">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-zinc-300 text-sky-700 focus:ring-sky-500"
                          checked={badgeEnabledDraft}
                          disabled={blocked}
                          onChange={(e) => {
                            const on = e.target.checked;
                            setBadgeEnabledDraft(on);
                            if (!on) setDisclaimerDraft("");
                          }}
                        />
                        Show app badge
                      </label>
                    </div>
                    {badgeEnabledDraft ? (
                      <div>
                        <label htmlFor="faq-embed-badge-label" className="text-[11px] font-medium text-zinc-700">
                          Badge label
                        </label>
                        <input
                          id="faq-embed-badge-label"
                          type="text"
                          maxLength={80}
                          value={badgeLabelDraft}
                          onChange={(e) => setBadgeLabelDraft(e.target.value)}
                          disabled={blocked}
                          className="mt-1 w-full rounded-lg border border-zinc-200/90 bg-zinc-50/40 px-2.5 py-1.5 text-sm text-zinc-900 transition-colors focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-200/80 disabled:opacity-50"
                          placeholder={DEFAULT_APP_BADGE_LABEL}
                        />
                      </div>
                    ) : (
                      <p className="text-[11px] leading-relaxed text-zinc-500">
                        Badge hidden. Visitors see the default disclaimer: &ldquo;{DEFAULT_EMBED_AI_DISCLAIMER}&rdquo;
                      </p>
                    )}
                  </div>
                ) : null}
                {embed.embedAppBadgePolicy === "customizable" && badgeEnabledDraft ? (
                  <div className="border-t border-zinc-100 pt-3">
                    <label htmlFor="faq-embed-disclaimer" className="text-xs font-medium text-zinc-800">
                      AI disclaimer
                    </label>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">
                      Shown on the public widget. Leave blank for the default: &ldquo;{DEFAULT_EMBED_AI_DISCLAIMER}
                      &rdquo;
                    </p>
                    <textarea
                      id="faq-embed-disclaimer"
                      rows={2}
                      maxLength={500}
                      value={disclaimerDraft}
                      onChange={(e) => setDisclaimerDraft(e.target.value)}
                      disabled={blocked}
                      className="mt-1.5 w-full resize-y rounded-lg border border-zinc-200/90 bg-zinc-50/40 px-2.5 py-1.5 text-sm text-zinc-900 transition-colors focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-200/80 disabled:opacity-50"
                      placeholder="Leave blank for default disclaimer…"
                    />
                  </div>
                ) : null}
                <div className="border-t border-zinc-100 pt-3">
                  <p className="text-xs font-medium text-zinc-800">Further information link</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">
                    Optional single link (WhatsApp, website, Linktree, etc.). Provide both label and URL, or leave both
                    empty.
                  </p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <div>
                      <label htmlFor="faq-embed-link-label" className="text-[11px] font-medium text-zinc-700">
                        Link label
                      </label>
                      <input
                        id="faq-embed-link-label"
                        type="text"
                        maxLength={80}
                        value={linkLabelDraft}
                        onChange={(e) => setLinkLabelDraft(e.target.value)}
                        disabled={blocked}
                        className="mt-1 w-full rounded-lg border border-zinc-200/90 bg-zinc-50/40 px-2.5 py-1.5 text-sm text-zinc-900 transition-colors focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-200/80 disabled:opacity-50"
                        placeholder="e.g. WhatsApp us"
                      />
                    </div>
                    <div>
                      <label htmlFor="faq-embed-link-url" className="text-[11px] font-medium text-zinc-700">
                        Link URL
                      </label>
                      <input
                        id="faq-embed-link-url"
                        type="url"
                        maxLength={2048}
                        value={linkUrlDraft}
                        onChange={(e) => setLinkUrlDraft(e.target.value)}
                        disabled={blocked}
                        className="mt-1 w-full rounded-lg border border-zinc-200/90 bg-zinc-50/40 px-2.5 py-1.5 text-sm text-zinc-900 transition-colors focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-200/80 disabled:opacity-50"
                        placeholder="https://…"
                      />
                    </div>
                  </div>
                  {Boolean(linkLabelDraft.trim()) !== Boolean(linkUrlDraft.trim()) ? (
                    <p className="mt-1 text-[11px] text-amber-800">Enter both label and URL, or clear both.</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label htmlFor="faq-embed-color" className="text-xs font-medium text-zinc-800">
                      Accent color (hex)
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
                        className="w-32 rounded-lg border border-zinc-200/90 bg-zinc-50/40 px-2 py-1.5 font-mono text-xs text-zinc-900 transition-colors focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-200/80 disabled:opacity-50"
                        placeholder="#18181b"
                      />
                    </div>
                    {colorDraft.trim() && !HEX_EMBED_COLOR.test(colorDraft.trim()) ? (
                      <p className="mt-1 text-[11px] text-amber-800">Use #RGB, #RRGGBB, or #RRGGBBAA.</p>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-zinc-800">
                    <span>Profile picture</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml"
                      disabled={blocked}
                      className="max-w-[200px] text-[11px] file:mr-2 file:rounded file:border-0 file:bg-sky-100 file:px-2 file:py-1 file:text-xs file:font-medium file:text-sky-900"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        e.target.value = "";
                        if (f) void onAvatarFile(f);
                      }}
                    />
                  </label>
                  {embed.assistantProfileUrl ? (
                    <button
                      type="button"
                      disabled={blocked}
                      onClick={() => void onClearAvatar()}
                      className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
                    >
                      Remove picture
                    </button>
                  ) : null}
                  {embed.assistantProfileUrl ? (
                    <img
                      src={embed.assistantProfileUrl}
                      alt=""
                      className="h-10 w-10 rounded-full border border-zinc-200 object-cover"
                    />
                  ) : null}
                </div>
                <button
                  type="button"
                  disabled={
                    blocked ||
                    Boolean(colorDraft.trim() && !HEX_EMBED_COLOR.test(colorDraft.trim())) ||
                    Boolean(linkLabelDraft.trim()) !== Boolean(linkUrlDraft.trim())
                  }
                  onClick={() => void onSaveAppearance()}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-sky-300 bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : null}
                  Save appearance
                </button>
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
                <p className="text-xs text-zinc-600">
                  Generate a token under <strong className="text-zinc-800">Setup</strong> to unlock preview, copy
                  blocks, and links.
                </p>
              ) : !embed.enabled ? (
                <p className="text-xs leading-relaxed text-zinc-600">
                  Turn on <strong>Embed active</strong> under <strong>Setup</strong> for live answers and the preview
                  iframe.
                </p>
              ) : null}

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Parent page origins</p>
                <p id={`${formId}-origins-hint`} className="mt-1 text-xs leading-relaxed text-zinc-600">
                  Leave empty to only allow this app to iframe the widget. Add each site as a chip (same style as FAQ
                  categories). <code className="rounded bg-zinc-100 px-1 font-mono text-[11px]">https://…</code> or
                  localhost http. Max {MAX_EMBED_ALLOWED_ORIGINS}.
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
                <div className="overflow-hidden rounded-lg border border-zinc-200/70 bg-zinc-50/30">
                  <p className="border-b border-zinc-200/60 bg-white/80 px-3 py-2 text-xs font-medium text-zinc-700">
                    Live preview
                  </p>
                  <iframe
                    title="Embed preview"
                    src={`/embed/t/${encodeURIComponent(embedToken)}`}
                    className="h-[min(28rem,70vh)] w-full border-0 bg-white"
                  />
                </div>
              ) : showEmbedExamples && embedToken && !embed.enabled ? (
                <p className="rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-xs leading-relaxed text-amber-950">
                  Turn on <strong>Embed active</strong> on the Setup tab to load the preview here.
                </p>
              ) : null}

              {showEmbedExamples && fullPageUrlDisplay ? (
                <details className="group rounded-lg border border-zinc-200/70 bg-zinc-50/20 open:border-zinc-200 open:bg-white">
                  <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium text-zinc-800 marker:text-zinc-400">
                    Copy embed URL, token, or iframe HTML
                  </summary>
                  <div className="space-y-3 border-t border-zinc-200/80 p-3 pt-3">
                    <p className="text-[11px] leading-relaxed text-zinc-600">
                      The <strong>iframe</strong> block embeds a fixed{" "}
                      <strong>
                        {EMBED_IFRAME_W}×{EMBED_IFRAME_H}px
                      </strong>{" "}
                      chat panel in the bottom-right corner of your site.
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

      <p className="mt-4 text-xs leading-relaxed text-zinc-500">
        While <strong>Embed active</strong> is on, anyone with the link can use the widget. Rotate the token to revoke
        old links.
      </p>
    </section>
  );
}
