"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

type Variant = "primary" | "secondary" | "muted";

const shellClass: Record<Variant, string> = {
  primary: "border-sky-200/70 bg-sky-50/30 shadow-sm",
  secondary: "border-zinc-200 bg-white shadow-sm",
  muted: "border-zinc-200/80 bg-zinc-50/50",
};

const titleClass: Record<Variant, string> = {
  primary: "text-sky-900",
  secondary: "text-zinc-800",
  muted: "text-zinc-600",
};

type Props = {
  title: string;
  description?: ReactNode;
  variant?: Variant;
  collapsible?: boolean;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
};

export function DocsSubsection({
  title,
  description,
  variant = "secondary",
  collapsible = false,
  defaultOpen = true,
  children,
  className = "",
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  const header = (
  <>
      <p className={`text-sm font-semibold ${titleClass[variant]}`}>{title}</p>
      {description && (collapsible ? open : true) ? (
        <div className="mt-1 text-sm leading-relaxed text-zinc-600">{description}</div>
      ) : null}
    </>
  );

  if (collapsible) {
    return (
      <section className={`min-w-0 max-w-full overflow-hidden rounded-xl border ${shellClass[variant]} ${className}`.trim()}>
        <button
          type="button"
          className="flex w-full items-start justify-between gap-3 p-5 text-left sm:p-6"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <div className="min-w-0 flex-1">{header}</div>
          <ChevronDown
            className={`mt-0.5 h-4 w-4 shrink-0 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
        {open ? (
          <div className="space-y-4 border-t border-zinc-200/80 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
            {children}
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section className={`min-w-0 max-w-full rounded-xl border p-5 sm:p-6 ${shellClass[variant]} ${className}`.trim()}>
      {header}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}
