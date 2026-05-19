"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { AlertCircle, Bot, ExternalLink, Loader2, MessageCircle, Send, Sparkles, X } from "lucide-react";

import { loadEmbedChatMessages, saveEmbedChatMessages } from "@/lib/embed-chat-storage";
import { DEFAULT_EMBED_AI_DISCLAIMER } from "@/lib/embed-disclaimer";
import {
  isEmbedLivePreview,
  isInEmbedIframe,
  isParentControlledEmbedClose,
  postSapAiEmbedMessage,
} from "@/lib/embed-post-message";

import { useEmbedRagChat } from "@/app/forms/projectFaqDocuments/useEmbedRagChat";
import { isRecaptchaEnabledOnClient } from "@/lib/recaptcha-client";
import { cn } from "@/lib/utils";

import styles from "./EmbedRagChat.module.css";

type Msg = { id: string; role: "user" | "assistant"; content: string; isError?: boolean };

export type EmbedFurtherInfoLink = { label: string; url: string };
export type EmbedPublicAppBadge = { label: string };

export type EmbedPublicBranding = {
  assistantName: string | null;
  assistantDescription: string | null;
  assistantGreeting: string | null;
  embedColor: string | null;
  assistantProfileUrl: string | null;
  aiDisclaimer: string | null;
  furtherInfoLink: EmbedFurtherInfoLink | null;
  appBadge: EmbedPublicAppBadge | null;
};

type Props = {
  token: string;
  /** When false, show a non-dismissible banner (token revoked / embed off). */
  embedActive: boolean;
  /** Loaded from public embed status when active; null uses defaults. */
  branding: EmbedPublicBranding | null;
};

const HEX_EMBED = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

function resolveAccent(embedColor: string | null | undefined): string {
  const t = embedColor?.trim() ?? "";
  return t && HEX_EMBED.test(t) ? t : "#18181b";
}

function tryPrettyJsonBlock(s: string): string | null {
  const t = s.trim();
  if (t.length < 2) return null;
  if (!((t.startsWith("{") && t.endsWith("}")) || (t.startsWith("[") && t.endsWith("]")))) return null;
  if (t.includes("```")) return null;
  try {
    return JSON.stringify(JSON.parse(t), null, 2);
  } catch {
    return null;
  }
}

const markdownComponents: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-1 marker:text-zinc-400">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-1 marker:text-zinc-400">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed [&>p]:mb-0">{children}</li>,
  h1: ({ children }) => <h3 className="mb-2 mt-3 text-base font-bold first:mt-0">{children}</h3>,
  h2: ({ children }) => <h3 className="mb-2 mt-3 text-base font-bold first:mt-0">{children}</h3>,
  h3: ({ children }) => <h4 className="mb-1.5 mt-2 text-sm font-semibold">{children}</h4>,
  strong: ({ children }) => <strong className="font-semibold text-zinc-900">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ href, children }) => (
    <a
      href={href}
      className="font-medium text-sky-700 underline underline-offset-2 hover:text-sky-800"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-zinc-300 pl-3 text-zinc-600 [&>p]:mb-0">{children}</blockquote>
  ),
  hr: () => <hr className="my-3 border-zinc-200" />,
  table: ({ children }) => (
    <div className={cn("my-2 max-w-full overflow-x-auto", styles.scrollSleek)}>
      <table className="w-full min-w-0 border-collapse text-left text-[13px] text-zinc-800">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="border-b border-zinc-200 bg-zinc-100/80">{children}</thead>,
  th: ({ children }) => <th className="px-2 py-1.5 font-semibold">{children}</th>,
  td: ({ children }) => <td className="border-t border-zinc-100 px-2 py-1.5 align-top">{children}</td>,
  pre: ({ children }) => <>{children}</>,
  code({ className, children, ...props }) {
    const text = String(children).replace(/\n$/, "");
    const isBlock = Boolean(/language-\w+/.exec(className || "")) || text.includes("\n");
    if (!isBlock) {
      return (
        <code
          className="rounded-md bg-zinc-900/10 px-1.5 py-0.5 font-mono text-[0.88em] text-zinc-900"
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <pre
        className={cn(
          "my-2 max-h-52 overflow-auto rounded-xl border border-zinc-700/40 bg-zinc-950 px-3 py-2.5",
          styles.scrollSleek,
        )}
      >
        <code className={cn("font-mono text-[12px] leading-relaxed text-zinc-100", className)} {...props}>
          {children}
        </code>
      </pre>
    );
  },
};

function AssistantMessageBody({ content, compact }: { content: string; compact?: boolean }) {
  const jsonBlock = tryPrettyJsonBlock(content);
  if (jsonBlock) {
    return (
      <pre
        className={cn(
          "overflow-auto whitespace-pre rounded-xl border border-zinc-700/40 bg-zinc-950 px-3 py-2.5 font-mono text-[12px] leading-relaxed text-emerald-100/95",
          compact ? "max-h-40" : "max-h-72",
          styles.scrollSleek,
        )}
      >
        <code>{jsonBlock}</code>
      </pre>
    );
  }
  return (
    <div
      className={cn(
        "leading-relaxed text-zinc-800",
        compact ? "text-xs [&_pre]:!max-h-32" : "text-sm",
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

export function EmbedRagChat({ token, embedActive, branding }: Props) {
  const formId = useId();
  const rag = useEmbedRagChat(token);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [chatHydrated, setChatHydrated] = useState(false);
  const [showProfileInfo, setShowProfileInfo] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [parentControlledClose, setParentControlledClose] = useState(false);
  const [livePreviewEmbed, setLivePreviewEmbed] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const greetingInjectedRef = useRef(false);
  const storageTokenRef = useRef(token);

  const accent = resolveAccent(branding?.embedColor ?? null);
  const displayName = branding?.assistantName?.trim() ? branding.assistantName.trim() : "Assistant";
  const profileUrl = branding?.assistantProfileUrl?.trim() || null;
  const profileDescription = branding?.assistantDescription?.trim() || null;
  const disclaimerText = branding?.aiDisclaimer?.trim() || DEFAULT_EMBED_AI_DISCLAIMER;
  const furtherInfoLink = branding?.furtherInfoLink ?? null;
  const appBadge = branding?.appBadge ?? null;

  const compact = isEmbedded;
  const recaptchaNotice = isRecaptchaEnabledOnClient();
  const showDisclaimerText = Boolean(disclaimerText || furtherInfoLink);

  useEffect(() => {
    setIsEmbedded(isInEmbedIframe());
    setParentControlledClose(isParentControlledEmbedClose());
    setLivePreviewEmbed(isEmbedLivePreview());
  }, []);

  useEffect(() => {
    if (parentControlledClose) setPanelOpen(true);
  }, [parentControlledClose]);

  useLayoutEffect(() => {
    storageTokenRef.current = token;
    setChatHydrated(false);
    greetingInjectedRef.current = false;
    const stored = loadEmbedChatMessages(token);
    setMessages(stored);
    if (stored.length > 0) greetingInjectedRef.current = true;
    setChatHydrated(true);
  }, [token]);

  useEffect(() => {
    if (!chatHydrated || storageTokenRef.current !== token) return;
    saveEmbedChatMessages(token, messages);
  }, [token, messages, chatHydrated]);

  useEffect(() => {
    if (!embedActive || !chatHydrated) return;
    const g = branding?.assistantGreeting?.trim();
    if (!g || greetingInjectedRef.current) return;
    greetingInjectedRef.current = true;
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", content: g }]);
  }, [embedActive, branding?.assistantGreeting, chatHydrated]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, rag.running]);

  const send = useCallback(async () => {
    const q = draft.trim();
    if (!q || rag.running || !embedActive) return;
    setDraft("");
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", content: q }]);
    const out = await rag.run(q);
    if (out.ok) {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: out.answer.trim() ? out.answer : "No text returned.",
        },
      ]);
    } else {
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "assistant", content: out.message, isError: true },
      ]);
    }
  }, [draft, rag, embedActive]);

  const openPanel = useCallback(() => {
    setPanelOpen(true);
    postSapAiEmbedMessage("open");
  }, []);

  const closePanel = useCallback(() => {
    if (parentControlledClose) {
      postSapAiEmbedMessage("close");
      return;
    }
    setPanelOpen(false);
    if (!livePreviewEmbed) postSapAiEmbedMessage("close");
  }, [parentControlledClose, livePreviewEmbed]);

  if (!panelOpen && !parentControlledClose) {
    return (
      <div
        className={cn("flex h-full min-h-0 w-full items-end justify-end", compact ? "p-2" : "p-4")}
        style={{ ["--embed-accent" as string]: accent }}
      >
        <button
          type="button"
          onClick={openPanel}
          className={cn(
            styles.fabReopen,
            "inline-flex items-center justify-center rounded-full text-white transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400",
            compact ? "h-12 w-12" : "h-14 w-14",
          )}
          style={{ backgroundColor: accent }}
          aria-label={`Open ${displayName}`}
        >
          <MessageCircle className={cn(compact ? "h-5 w-5" : "h-6 w-6")} aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn("flex h-full min-h-0 w-full flex-col", !compact && "p-3 sm:p-4")}
      style={{ ["--embed-accent" as string]: accent }}
    >
      <div
        className={cn(
          styles.shell,
          "flex min-h-0 flex-1 flex-col overflow-hidden border border-zinc-200/80 bg-white",
          compact ? cn("h-full", styles.shellCompact) : styles.shellStandalone,
        )}
        role="region"
        aria-label={`${displayName} chat`}
      >
        <div className={styles.accentBar} aria-hidden />
        <header
          className={cn(
            "relative flex shrink-0 items-center gap-2.5 border-b border-zinc-200/80 bg-white/95 backdrop-blur-sm",
            compact ? "px-2.5 py-2 pr-9" : "px-3.5 py-2.5 pr-11",
          )}
        >
          <button
            type="button"
            onClick={closePanel}
            className="absolute right-1.5 top-1/2 z-10 -translate-y-1/2 rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sky-400"
            aria-label="Close chat"
          >
            <X className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4")} aria-hidden />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            {profileUrl ? (
              <button
                type="button"
                disabled={!profileDescription}
                onClick={() => {
                  if (!profileDescription) return;
                  setShowProfileInfo((v) => !v);
                }}
                className={cn(
                  "flex shrink-0 overflow-hidden rounded-full ring-2 ring-white shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400",
                  profileDescription ? "cursor-pointer hover:opacity-90" : "cursor-default opacity-90",
                  compact ? "h-8 w-8" : "h-9 w-9",
                )}
                aria-label={profileDescription ? "About the assistant" : "Assistant"}
                aria-expanded={showProfileInfo}
              >
                <img src={profileUrl} alt="" className="h-full w-full object-cover" />
              </button>
            ) : (
              <span
                className={cn(
                  "flex shrink-0 items-center justify-center rounded-full text-white shadow-sm ring-2 ring-white",
                  compact ? "h-8 w-8" : "h-9 w-9",
                )}
                style={{ backgroundColor: accent }}
              >
                <Bot className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4")} aria-hidden />
              </span>
            )}
            <div className="min-w-0">
              <p className={cn("truncate font-semibold text-zinc-900", compact ? "text-xs" : "text-sm")}>
                {displayName}
              </p>
              {appBadge ? (
                <p
                  className={cn(
                    "mt-0.5 truncate font-medium text-zinc-600",
                    compact ? "text-[9px] leading-tight" : "text-[10px] leading-snug",
                  )}
                >
                  {appBadge.label}
                </p>
              ) : null}
            </div>
          </div>
          {showProfileInfo && profileDescription ? (
            <div
              className="absolute left-3 top-full z-20 mt-1 max-h-48 min-w-[200px] max-w-[min(280px,calc(100%-1rem))] overflow-y-auto rounded-xl border border-zinc-200/90 bg-white/95 p-3 text-left text-xs leading-relaxed text-zinc-800 shadow-xl backdrop-blur-sm"
              role="region"
              aria-label="Assistant description"
            >
              <p className="whitespace-pre-wrap wrap-break-word">{profileDescription}</p>
              <button
                type="button"
                className="mt-2 text-[11px] font-medium text-sky-700 hover:underline"
                onClick={() => setShowProfileInfo(false)}
              >
                Close
              </button>
            </div>
          ) : null}
        </header>

        {!embedActive ? (
          <div
            className={cn(
              "mx-3 mt-3 flex shrink-0 items-start gap-2 rounded-xl border border-amber-200/90 bg-amber-50/95 px-3 py-2.5 text-amber-950 shadow-sm",
              compact ? "text-xs" : "text-sm",
            )}
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden />
            <p className="leading-relaxed">
              This assistant is unavailable — the embed may be off, the link invalid, or the plan may not include
              public embed.
            </p>
          </div>
        ) : null}

        <div
          className={cn(
            styles.messagesArea,
            "min-h-0 flex-1 space-y-3 overflow-y-auto",
            compact ? "space-y-2 px-2.5 py-2.5" : "space-y-3 px-3.5 py-3.5",
            styles.scrollSleek,
          )}
        >
          {messages.length === 0 && !rag.running ? (
            <div
              className={cn(
                "flex flex-col items-center justify-center gap-2 text-center",
                compact ? "px-2 py-6" : "px-4 py-10",
              )}
            >
              <span
                className={cn(
                  styles.emptyIconRing,
                  "flex items-center justify-center rounded-2xl text-zinc-700",
                  compact ? "h-11 w-11" : "h-14 w-14",
                )}
              >
                <Sparkles className={cn(compact ? "h-5 w-5" : "h-6 w-6")} style={{ color: accent }} aria-hidden />
              </span>
              <p className={cn("font-semibold text-zinc-900", compact ? "text-xs" : "text-sm")}>
                {displayName}
              </p>
              <p className={cn("font-medium text-zinc-700", compact ? "text-xs" : "text-sm")}>
                Ask your knowledge base
              </p>
              <p
                className={cn(
                  "leading-relaxed text-zinc-500",
                  compact ? "max-w-[220px] text-[11px]" : "max-w-[280px] text-xs",
                )}
              >
                Answers use your project&apos;s uploaded files.
              </p>
            </div>
          ) : null}

          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                styles.messageIn,
                "flex",
                m.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={
                  m.role === "user"
                    ? cn(
                        "max-w-[90%] rounded-2xl rounded-br-md leading-relaxed text-white shadow-sm",
                        compact ? "px-2.5 py-2 text-xs" : "px-3.5 py-2.5 text-sm",
                      )
                    : m.isError
                      ? cn(
                          "max-w-[92%] rounded-2xl rounded-bl-md border border-red-200 bg-red-50 leading-relaxed text-red-900 shadow-sm",
                          compact ? "px-2.5 py-2 text-xs" : "px-3.5 py-2.5 text-sm",
                        )
                      : cn(
                          "max-w-[92%] rounded-2xl rounded-bl-md border border-zinc-200/80 bg-white/95 shadow-sm ring-1 ring-zinc-100/80",
                          compact ? "px-2.5 py-2" : "px-3.5 py-2.5",
                        )
                }
                style={m.role === "user" && !m.isError ? { backgroundColor: accent } : undefined}
              >
                {m.role === "user" || m.isError ? (
                  <p className="whitespace-pre-wrap wrap-break-word">{m.content}</p>
                ) : (
                  <AssistantMessageBody content={m.content} compact={compact} />
                )}
              </div>
            </div>
          ))}

          {rag.running ? (
            <div className="flex justify-start" aria-live="polite" aria-busy="true">
              <div
                className={cn(
                  "max-w-[92%] rounded-2xl rounded-bl-md border border-zinc-200/90 bg-white shadow-sm",
                  compact ? "px-3 py-2.5" : "px-4 py-3",
                )}
              >
                <span className="sr-only">Assistant is typing</span>
                <div className={styles.typingBubble} aria-hidden>
                  <span className={styles.typingDot} />
                  <span className={styles.typingDot} />
                  <span className={styles.typingDot} />
                </div>
              </div>
            </div>
          ) : null}

          <div ref={endRef} />
        </div>

        <div
          className={cn(
            "shrink-0 border-t border-zinc-200/80 bg-white/95 backdrop-blur-sm",
            compact ? "px-2.5 pt-2 pb-2" : "px-3.5 pt-2.5 pb-3",
          )}
        >
          {showDisclaimerText ? (
            <p
              className={cn(
                "text-center leading-snug text-zinc-400",
                recaptchaNotice ? "mb-1" : "mb-2",
                compact ? "text-[9px]" : "text-[10px]",
              )}
              role="note"
            >
              {disclaimerText}
              {furtherInfoLink ? (
                <>
                  {" "}
                  <a
                    href={furtherInfoLink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-sky-700 underline underline-offset-2 hover:text-sky-800"
                  >
                    {furtherInfoLink.label}
                  </a>
                </>
              ) : null}
            </p>
          ) : null}
          {recaptchaNotice ? (
            <p
              className={cn(
                "mb-2 text-center leading-snug text-zinc-400",
                compact ? "text-[7.5px]" : "text-[8.5px]",
              )}
            >
              Protected by reCAPTCHA. Google{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-zinc-600"
              >
                Privacy
              </a>{" "}
              and{" "}
              <a
                href="https://policies.google.com/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-zinc-600"
              >
                Terms
              </a>{" "}
              apply.
            </p>
          ) : null}
          <form
            id={formId}
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <label className="sr-only" htmlFor={`${formId}-q`}>
              Message
            </label>
            <textarea
              id={`${formId}-q`}
              rows={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder="Message…"
              disabled={rag.running || !embedActive}
              className={cn(
                "max-h-24 flex-1 resize-none rounded-xl border border-zinc-200/90 bg-zinc-50/90 shadow-inner outline-none transition placeholder:text-zinc-400 focus:border-zinc-300 focus:ring-2 focus:ring-[color-mix(in_srgb,var(--embed-accent)_28%,transparent)] disabled:opacity-50",
                compact
                  ? "min-h-[38px] px-2.5 py-2 text-xs"
                  : "min-h-[44px] max-h-28 px-3 py-2.5 text-sm",
                styles.scrollSleek,
              )}
            />
            <button
              type="submit"
              disabled={rag.running || !draft.trim() || !embedActive}
              className={cn(
                "inline-flex shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition hover:opacity-90 disabled:opacity-40",
                compact ? "h-9 w-9" : "h-11 w-11",
              )}
              style={{ backgroundColor: accent }}
              aria-label="Send"
            >
              {rag.running ? (
                <Loader2 className={cn(compact ? "h-4 w-4" : "h-5 w-5", "animate-spin")} aria-hidden />
              ) : (
                <Send className={cn(compact ? "h-4 w-4" : "h-5 w-5")} aria-hidden />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
