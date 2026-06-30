"use client";

import type { LucideIcon } from "lucide-react";
import {
  BriefcaseBusiness,
  CodeXml,
  FileText,
  MessageSquare,
  Send,
  Sparkles,
  Zap,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRef, useState, useSyncExternalStore } from "react";
import { useSapAi } from "@/app/providers/sapai-provider";
import { useSapAiLandingAnimations } from "./useSapAiLandingAnimations";
import { Highlighter } from "@/components/ui/highlighter"
import { SparklesText } from "@/components/ui/sparkles-text"

/** [React Bits DotField](https://www.reactbits.dev/tools/background-studio)   canvas + cursor glow; no SSR. */
const DotField = dynamic(() => import("@/components/DotField"), {
  ssr: false,
  loading: () => <div className="fixed inset-0 z-0 bg-zinc-50" aria-hidden />,
});

/** React Bits ColorBends   WebGL shader; no SSR. */
const ColorBends = dynamic(() => import("@/components/ColorBends"), {
  ssr: false,
});

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (notify) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", notify);
      return () => mq.removeEventListener("change", notify);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

const glassCard =
  "rounded-2xl border border-zinc-200/90 bg-white shadow-[0_1px_0_0_rgba(0,0,0,0.04),0_12px_40px_-12px_rgba(15,23,42,0.08)] backdrop-blur-sm";

export default function SapAiLandingPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const { appConfig, appConfigLoading, user } = useSapAi();
  const brand = appConfig?.appName?.trim() || "SapAi";
  const [newsletterDone, setNewsletterDone] = useState(false);
  const reduceMotion = usePrefersReducedMotion();

  useSapAiLandingAnimations(rootRef);

  const brandLogoUrl = appConfig?.brandLogoUrl;

  return (
    <div
      ref={rootRef}
      className="relative overflow-x-hidden bg-zinc-50 text-zinc-900 antialiased selection:bg-zinc-900/10 selection:text-zinc-900"
    >
      {/* Interactive dot field (ripple-style); static fallback when reduced motion */}
      <div className="pointer-events-none fixed inset-0 z-0 min-h-[100dvh] w-full">
        {reduceMotion ? (
          <div className="absolute inset-0 bg-gradient-to-br from-violet-50/90 via-zinc-50 to-fuchsia-50/80" aria-hidden />
        ) : (
          <DotField
            dotRadius={1.5}
            dotSpacing={14}
            cursorRadius={500}
            cursorForce={0.1}
            bulgeOnly={false}
            bulgeStrength={67}
            sparkle={false}
            waveAmplitude={0}
            gradientFrom="rgba(168, 85, 247, 0.9)"
            gradientTo="rgba(180, 151, 207, 0.9)"
            className="h-full min-h-[100dvh] w-full"
            aria-hidden
          />
        )}
      </div>
      {/* Light veil so foreground typography stays readable over dense dots */}
      <div
        className="pointer-events-none fixed inset-0 z-[1] bg-gradient-to-b from-white/55 via-white/35 to-white/65"
        aria-hidden
      />

      {/* Hero */}
      <section
        data-hero-section
        className="relative z-10 mx-auto flex min-h-[min(100vh,920px)] max-w-7xl flex-col justify-center px-6 pb-24 pt-28 md:flex-row md:items-center md:gap-12 md:pb-32 md:pt-24"
      >
        {/* Hero-only ColorBends layer (behind content, above global dot field) */}
        {!reduceMotion ? (
          <div
            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[32px]"
            style={{
              // Soft edge fade (avoid hard cut-off at hero bounds).
              WebkitMaskImage:
                "radial-gradient(70% 80% at 50% 45%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.95) 55%, rgba(0,0,0,0.45) 80%, rgba(0,0,0,0) 100%)",
              maskImage:
                "radial-gradient(70% 80% at 50% 45%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.95) 55%, rgba(0,0,0,0.45) 80%, rgba(0,0,0,0) 100%)",
            }}
          >
            <ColorBends
              className="absolute inset-0 opacity-[0.3]"
              colors={["#ff5c7a", "#8a5cff", "#00ffd1"]}
              rotation={90}
              speed={0.2}
              scale={1}
              frequency={1}
              warpStrength={1}
              mouseInfluence={1}
              noise={0.15}
              parallax={0.5}
              iterations={1}
              intensity={1.5}
              bandWidth={6}
              transparent
            />
            <div
              className="absolute inset-0 bg-gradient-to-b from-white/55 via-white/35 to-white/65"
              aria-hidden
            />
          </div>
        ) : null}

        <div className="relative flex-1 space-y-8 md:max-w-xl">
          <div data-hero-line className="mb-2">
            {/* <Sparkles className="h-3.5 w-3.5 text-violet-600" strokeWidth={2} aria-hidden />
            {appConfigLoading ? "…" : brand}
            <span className="text-zinc-300">·</span>
            AI platform */}

            {brandLogoUrl ? <img src={brandLogoUrl} alt="" className="w-50" /> : null}
          </div>
          <h1
            data-hero-line
            className="text-4xl font-semibold leading-[1.08] tracking-tight text-zinc-900 md:text-6xl md:leading-[1.05]"
          >
            As easy as
            <span className="block">
              <span className="bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-500 bg-clip-text text-transparent">
                Plug &{" "}
              </span>
              <Highlighter action="highlight" color="#87CEFA">
                <span className="inline-block bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-500 bg-clip-text text-transparent">
                  Chat
                </span>
              </Highlighter>
            </span>
          </h1>
          <p data-hero-line className="max-w-lg text-lg leading-relaxed text-zinc-600 md:text-xl">
          SapAi lets you build intelligent AI assistants for support, Q&A, and workflow automation. Deploy through API integration or{" "}
          <Highlighter action="underline" color="#87CEFA">
             embed anywhere
          </Highlighter>
          {" "}
          using a lightweight iframe widget.
          </p>
          <div data-hero-line className="flex flex-wrap items-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-900 px-8 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
              >
                Open dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="group inline-flex h-12 items-center justify-center rounded-full bg-zinc-900 px-8 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
                >
                  <span className="flex items-center gap-2">
                    Start free trial
                    <Zap className="h-4 w-4 transition group-hover:rotate-12" strokeWidth={2} aria-hidden />
                  </span>
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center rounded-full border border-zinc-200 bg-white px-7 text-sm font-medium text-zinc-800 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
                >
                  Sign in
                </Link>
              </>
            )}
            <Link
              href="/docs/api"
              className="inline-flex h-12 items-center px-4 text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
            >
              API reference →
            </Link>
          </div>
        </div>

        {/* Hero visual cluster */}
        <div className="relative mt-16 flex flex-1 justify-center md:mt-0 md:justify-end">
          <div
            data-parallax-slow
            data-hero-visual
            className={`relative w-full max-w-lg ${glassCard} p-5 md:p-6`}
          >
            <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-400" />
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
              </div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                SapAi · Live
              </span>
            </div>
            <div className="space-y-3 font-mono text-xs leading-relaxed">
              <div className="flex gap-2">
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-zinc-700">
                   Hi I am your AI assistant, that is fully customizable. How can I help you today?
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-zinc-900 px-3 py-2.5 text-white">
                  pls pls pls hlp em,  need to know the refund plicy
                </div>
              </div>
              <div className="flex gap-2">
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-zinc-700">
                  Sure, our refund policy ...
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1 text-zinc-500">
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-400" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-300 [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-200 [animation-delay:300ms]" />
                </span>
                <span className="text-[11px]">SapAi is thinking…</span>
              </div>
            </div>
          </div>

          {/* Floating stat cards */}
          <div
            data-float-card
            data-parallax-fast
            className={`absolute -left-2 top-8 z-20 hidden w-44 p-4 md:block ${glassCard}`}
          >
            <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              Resolution rate
            </p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-zinc-900">94%</p>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-zinc-100">
              <div className="h-full w-[94%] rounded-full bg-gradient-to-r from-violet-500 to-violet-600" />
            </div>
          </div>
          <div
            data-float-card
            data-parallax-fast
            className={`absolute -right-4 bottom-12 z-20 hidden w-48 p-4 md:block ${glassCard}`}
          >
            <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              Avg. response
            </p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-zinc-900">1.2s</p>
            <p className="mt-2 text-[11px] font-medium text-emerald-600">↓ 38% vs last month</p>
          </div>
        </div>
      </section>

      {/* Automation */}
      <section data-reveal className="relative z-10 mx-auto max-w-7xl px-6 py-24 md:py-32">
        <div data-section-head className="mx-auto max-w-2xl text-center">

        <SparklesText>

          {brandLogoUrl ? (
            <img src={brandLogoUrl} alt="" className="w-100 mx-auto mb-4" />
          ) : null}
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 md:text-4xl">
            Chatbot that never sleeps
          </h2>
          <p className="mt-4 text-lg text-zinc-600">
            Reply to your customer in seconds, not hours.
          </p>
        </SparklesText>
        </div>
      </section>

      {/* Knowledge + API + embed (product-shaped) */}
      <section
        data-reveal
        className="relative z-10 border-y border-zinc-100 bg-zinc-50/80 py-24 md:py-32"
      >
        <div className="mx-auto grid max-w-7xl gap-16 px-6 md:grid-cols-2 md:items-center md:gap-20">
          <div data-section-head>
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 md:text-4xl">
              Answers grounded in your files
            </h2>
            <p className="mt-4 text-lg text-zinc-600">
              Each project has its own knowledge: upload FAQs and documents, run RAG chat jobs through the API, or ship
              the same assistant on your site with the public embed, then review usage and job history in the
              dashboard.
            </p>
            <ul className="mt-8 space-y-4 text-sm text-zinc-700">
              {[
                "Per-project FAQ documents and categories for RAG",
                "Server-side chat jobs via API key   embed uses a separate token",
                "Dashboard for keys, FAQ workspace, and analytics on paid plans",
              ].map((t) => (
                <li key={t} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs text-white">
                    ✓
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className={`${glassCard} relative overflow-hidden p-6 md:p-8`} data-reveal>
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-violet-100/80 blur-3xl" />
            <div className="relative space-y-4">
              <div className="rounded-xl border border-zinc-200/90 bg-zinc-50/90 p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-zinc-200/80">
                    <FileText className="h-4 w-4 text-zinc-600" strokeWidth={2} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Knowledge</p>
                    <p className="mt-1 text-sm leading-snug text-zinc-800">
                      Docs attach to one API key / project   every RAG reply stays scoped to that set.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200/90 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white shadow-sm">
                    <CodeXml className="h-4 w-4" strokeWidth={2} aria-hidden />
                  </span>
                  <div className="min-w-0 font-mono text-[11px] leading-relaxed text-zinc-700">
                    <p className="text-zinc-500">POST /api/v1/chat</p>
                    <p className="mt-1 text-zinc-600">
                      <span className="font-mono text-[11px]">{`{ "taskType": "rag", … }`}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-violet-200/90 bg-violet-50/60 p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-violet-200/80">
                    <MessageSquare className="h-4 w-4 text-violet-700" strokeWidth={2} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-800/90">Public embed</p>
                    <p className="mt-1 text-sm leading-snug text-zinc-800">
                      Lightweight iframe widget on your domain   styled from the dashboard, scoped with an embed token
                      (not your secret API key).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How you connect (honest surfaces) */}
      <section data-reveal className="relative z-10 mx-auto max-w-7xl px-6 py-24 md:py-32">
        <div data-section-head className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 md:text-4xl">
            Fits the stack you already run
          </h2>
          <p className="mt-4 text-lg text-zinc-600">
            SapAi is a <strong className="font-medium text-zinc-800">documented HTTPS API</strong> plus an optional{" "}
            <strong className="font-medium text-zinc-800">hosted embed</strong>. Call it from your backend, edge
            worker, or script, wire Slack, Shopify, or anything else yourself on top of plain HTTP.
          </p>
          <p className="mt-3 text-sm text-zinc-500">
            <Link href="/docs/api" className="font-medium text-sky-800 underline-offset-2 hover:underline">
              Browse API docs
            </Link>{" "}
            for routes, examples, and job lifecycle.
          </p>
        </div>
        <div className="mt-14 flex flex-wrap justify-center gap-3 md:gap-4">
          {[
            // "Answers grounded in your documents",
            // "Ship in your product or on your site",
            // "Dashboard for projects, keys & FAQ",
            // "Embeddable assistant you can style",
            // "Clear API docs and copy-paste examples",
            // "Usage and job history when you need them",
          ].map((name) => (
            <div
              key={name}
              data-integration-item
              className="rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900"
            >
              {name}
            </div>
          ))}
        </div>
      </section>

      {/* Early access */}
      <section data-reveal className="relative z-10 mx-auto max-w-7xl px-6 pb-24 md:pb-32">
        <div data-section-head className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 md:text-4xl">
            Early testing phase
          </h2>
          <p className="mt-4 text-lg text-zinc-600">
            SapAi is live for builders who want to try FAQ RAG, the chat API, and embeds while we harden the platform.
            Expect rough edges, our feedback shapes what ships next.
          </p>
        </div>
        <div className="mx-auto mt-14 max-w-2xl">
          <div
            data-testimonial
            className={`${glassCard} flex flex-col justify-between p-8 transition hover:border-zinc-300 hover:shadow-md md:p-10`}
          >
            <p className="text-base leading-relaxed text-zinc-700 md:text-lg">
              We&apos;re validating the full loop: upload Markdown knowledge, run chat and RAG jobs through the API,
              monitor usage in the dashboard, and (on paid plans) drop the embed on your site. Limits, pricing, and docs
              may change as we learn from real projects.
            </p>
            <footer className="mt-8 border-t border-zinc-100 pt-6">
              <p className="font-medium text-zinc-900">Want in?</p>
              <p className="mt-1 text-sm text-zinc-500">
                Start on the{" "}
                <Link href="/pricing" className="font-medium text-zinc-800 underline-offset-2 hover:underline">
                  Free plan
                </Link>{" "}
                or read the{" "}
                <Link href="/docs/api" className="font-medium text-zinc-800 underline-offset-2 hover:underline">
                  API docs
                </Link>{" "}
                  and tell us what breaks.
              </p>
            </footer>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section data-reveal className="relative z-10 mx-auto max-w-7xl px-6 pb-24">
        <div
          className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white px-8 py-14 text-center shadow-sm md:px-16"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-violet-100/40 via-transparent to-transparent" />
          <h2 className="relative text-3xl font-semibold text-zinc-900 md:text-4xl">
            Ready for a cinematic chat experience?
          </h2>
          <p className="relative mx-auto mt-3 max-w-lg text-zinc-600">
            Join teams building the next generation of AI native support, polished, fast, and ready
            for production.
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex h-12 items-center rounded-full bg-zinc-900 px-8 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
            >
              Get started
            </Link>
            <Link
              href="/docs/api"
              className="inline-flex h-12 items-center rounded-full border border-zinc-200 bg-white px-8 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50"
            >
              Browse API
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-200 bg-zinc-50/90 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-4">
            {brandLogoUrl ? <img src={brandLogoUrl} alt="" className="w-20" /> : null}
              <p className="text-lg font-semibold text-zinc-900">{brand}</p>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-zinc-600">
                AI-powered chatbots for modern websites. Elegant automation, enterprise-grade
                reliability.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-5 lg:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Product</p>
                <ul className="mt-4 space-y-2 text-sm text-zinc-600">
                  <li>
                    <Link href="/dashboard" className="transition hover:text-zinc-900">
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link href="/docs/api" className="transition hover:text-zinc-900">
                      API docs
                    </Link>
                  </li>
                  <li>
                    <Link href="/register" className="transition hover:text-zinc-900">
                      Pricing
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Company
                </p>
                <ul className="mt-4 space-y-2 text-sm text-zinc-600">
                  <li>
                    <a href="#" className="transition hover:text-zinc-900">
                      Blog
                    </a>
                  </li>
                </ul>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Contact
                </p>
                <ul className="mt-4 space-y-2 text-sm text-zinc-600">
                  <li>
                    <p className="transition hover:text-zinc-900">
                     amfphub@gmail.com
                    </p>
                  </li>
                  <li>Remote</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-zinc-200 pt-8 text-xs text-zinc-500 md:flex-row">
            <p>© {new Date().getFullYear()} {brand}. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="/terms" target="_blank" className="transition hover:text-zinc-400">
                Privacy
              </a>
              <a href="/terms" target="_blank" className="transition hover:text-zinc-400">
                Terms
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
