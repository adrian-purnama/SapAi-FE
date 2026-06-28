"use client";

import {
  Bot,
  ChevronDown,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Shield,
  UserPlus,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useSapAi } from "@/app/providers/sapai-provider";

function initialsFromEmail(email: string) {
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return local.slice(0, 2).toUpperCase() || "?";
}

type NavItem = {
  label: string;
  href?: string;
  description?: string;
  disabled?: boolean;
};

function NavMenu({
  label,
  items,
  buttonClassName,
}: {
  label: string;
  items: NavItem[];
  buttonClassName: string;
}) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  // If there's only one real destination, keep it a normal link.
  const enabledLinks = items.filter((i) => i.href && !i.disabled);
  const singleLink = enabledLinks.length === 1 ? enabledLinks[0] : null;

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!open) return;
      const root = rootRef.current;
      if (!root) return;
      if (event.target instanceof Node && !root.contains(event.target)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (singleLink) {
    return (
      <Link href={singleLink.href!} className={buttonClassName} title={singleLink.description}>
        {label}
      </Link>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className={buttonClassName}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        {label}
        <ChevronDown className={"h-4 w-4 shrink-0 opacity-70 transition " + (open ? "rotate-180" : "")} aria-hidden />
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 mt-2 w-[320px] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg"
        >
          <div className="p-2">
            {items.map((item) => {
              const row =
                "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition";
              const disabled = !item.href || item.disabled;
              if (disabled) {
                return (
                  <div
                    key={item.label}
                    className={row + " cursor-not-allowed opacity-60"}
                    role="menuitem"
                    aria-disabled="true"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-zinc-900">{item.label}</div>
                      {item.description ? (
                        <div className="mt-0.5 text-xs text-zinc-500">{item.description}</div>
                      ) : null}
                    </div>
                    <span className="ml-auto rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
                      Coming soon
                    </span>
                  </div>
                );
              }
              return (
                <Link
                  key={item.label}
                  href={item.href!}
                  role="menuitem"
                  className={row + " hover:bg-zinc-50"}
                  onClick={() => setOpen(false)}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-zinc-900">{item.label}</div>
                    {item.description ? (
                      <div className="mt-0.5 text-xs text-zinc-500">{item.description}</div>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function Navbar() {
  const { user, appConfig, logout } = useSapAi();

  const brandName = appConfig?.appName?.trim() || "SapAi";
  const logoUrl = appConfig?.brandLogoUrl;
  const planAccent = user?.plan?.accentColor?.trim() || "#18181b";
  const planLabel = user?.plan?.name ?? "Free";
  const [mobileOpen, setMobileOpen] = useState(false);

  /* Light chrome everywhere   landing matches interior for cohesion */
  const shell =
    "sticky top-0 z-50 border-b border-zinc-200/90 bg-white/95 backdrop-blur-md shadow-[0_1px_0_0_rgba(0,0,0,0.05)]";

  const navLink =
    "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900";

  const navMenuBtn =
    "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900";

  const primaryBtn =
    "inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800";

  const ghostBtn =
    "inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50";

  const brandMark = (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-zinc-900 to-zinc-800 shadow-inner ring-1 ring-zinc-900/10">
      <Bot className="h-[18px] w-[18px] text-white" strokeWidth={2} aria-hidden />
    </span>
  );

  return (
    <header className={shell}>
      <nav className="mx-auto flex h-[56px] w-full min-w-0 max-w-7xl items-center justify-between gap-4 overflow-x-clip px-4 sm:px-6">
        <Link
          href="/"
          className="group flex min-w-0 items-center gap-2.5 rounded-xl text-zinc-900 outline-none"
          onClick={() => setMobileOpen(false)}
        >
          {logoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element -- branding URL from config */
            <img
              src={logoUrl}
              alt=""
              className="h-8"
            />
          ) : (
            brandMark
          )}
          {/* <span className="truncate text-[15px] font-semibold tracking-tight">{brandName}</span> */}
        </Link>

        {/* Desktop nav */}
        <div className="hidden min-w-0 flex-1 items-center justify-end gap-1 sm:gap-2 md:flex">
          {/* <NavMenu
            label="Product"
            buttonClassName={navMenuBtn}
            items={[
              {
                label: "Chatbot",
                href: "/",
                description: "AI chatbot platform for websites.",
              },
              {
                label: "Inbox",
                description: "Human handoff & team workflows.",
                disabled: true,
              },
              {
                label: "Knowledge base",
                description: "Sources, embeddings, and retrieval.",
                disabled: true,
              },
            ]}
          /> */}

          <NavMenu
            label="Docs"
            buttonClassName={navMenuBtn}
            items={[
              { label: "API reference", href: "/docs/api", description: "Endpoints and payloads." },
              { label: "Blog", href: "/blog", description: "Product updates and guides." },
              { label: "Uptime", href: "https://uptime.amfphub.com/status/sapai", description: "Check the status or Incident Reports" },
            ]}
          />

          <Link href="/pricing" className={navMenuBtn}>
            Pricing
          </Link>

          {user ? (
            <>
              <Link href="/dashboard" className={navLink}>
                <LayoutDashboard className="h-4 w-4 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
                <span className="hidden md:inline">Dashboard</span>
              </Link>
              <Link
                href="/account"
                className="ml-0.5 flex max-w-44 items-center gap-1.5 rounded-full border border-zinc-200 bg-white py-1 pl-1 pr-2 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-400/40 sm:max-w-56 sm:gap-2 sm:pr-2.5"
                title={`${user.email} · ${planLabel} plan`}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-sm ring-1 ring-black/10"
                  style={{ backgroundColor: planAccent }}
                  aria-label={`${planLabel} plan`}
                >
                  {initialsFromEmail(user.email)}
                </span>
                <span className="hidden min-w-0 flex-1 truncate text-xs font-medium text-zinc-700 sm:inline">
                  {user.email}
                </span>
                {user.isAdmin ? (
                  <Shield
                    className="h-3.5 w-3.5 shrink-0 text-black sm:h-4 sm:w-4"
                    strokeWidth={2}
                    aria-label="Admin"
                  />
                ) : null}
              </Link>

              <button type="button" className={primaryBtn} onClick={() => void logout()}>
                <LogOut className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={ghostBtn}>
                <LogIn className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                <span className="hidden sm:inline">Login</span>
              </Link>
              <Link href="/register" className={primaryBtn}>
                <UserPlus className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                <span className="hidden sm:inline">Register</span>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex flex-1 items-center justify-end md:hidden">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:bg-zinc-50"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile panel */}
      {/* Backdrop */}
      <button
        type="button"
        className={[
          "fixed inset-0 z-40 bg-zinc-950/20 transition-opacity duration-200 md:hidden",
          "motion-reduce:transition-none",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
        aria-label="Close menu"
        onClick={() => setMobileOpen(false)}
      />

      {/* Panel */}
      <div
        className={[
          "relative z-50 md:hidden",
          "border-t border-zinc-200/90 bg-white",
          "motion-reduce:transition-none",
          mobileOpen ? "" : "pointer-events-none",
        ].join(" ")}
        aria-hidden={!mobileOpen}
      >
        <div
          className={[
            "grid",
            "transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
            "motion-reduce:transition-none",
            mobileOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          ].join(" ")}
        >
          <div className="overflow-hidden">
            <div
              className={[
                "mx-auto w-full max-w-7xl px-4 py-4 sm:px-6",
                "transition-[opacity,transform] duration-200 ease-out delay-75",
                "motion-reduce:transition-none motion-reduce:delay-0",
                mobileOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2",
              ].join(" ")}
            >
              <div className="grid gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Docs</p>
                  <div className="mt-2 grid gap-2">
                    <Link
                      href="/docs/api"
                      className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
                      onClick={() => setMobileOpen(false)}
                    >
                      API documentation
                    </Link>
                    <Link
                      href="/blog"
                      className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
                      onClick={() => setMobileOpen(false)}
                    >
                      Blog
                    </Link>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Pricing</p>
                  <div className="mt-2 grid gap-2">
                    <Link
                      href="/pricing"
                      className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
                      onClick={() => setMobileOpen(false)}
                    >
                      View pricing
                    </Link>
                  </div>
                </div>

                <div className="border-t border-zinc-200 pt-4">
                  {user ? (
                    <div className="grid gap-2">
                      <Link
                        href="/dashboard"
                        className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
                        onClick={() => setMobileOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/account"
                        className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
                        onClick={() => setMobileOpen(false)}
                      >
                        Account
                      </Link>
                      <button
                        type="button"
                        className="h-11 rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 motion-reduce:transition-none"
                        onClick={() => {
                          setMobileOpen(false);
                          void logout();
                        }}
                      >
                        Logout
                      </button>
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      <Link
                        href="/login"
                        className="h-11 rounded-lg border border-zinc-200 bg-white px-4 text-center text-sm font-semibold leading-[44px] text-zinc-800 hover:bg-zinc-50"
                        onClick={() => setMobileOpen(false)}
                      >
                        Login
                      </Link>
                      <Link
                        href="/register"
                        className="h-11 rounded-lg bg-zinc-900 px-4 text-center text-sm font-semibold leading-[44px] text-white hover:bg-zinc-800"
                        onClick={() => setMobileOpen(false)}
                      >
                        Register
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
