import type { ReactNode } from "react";

type Variant = "info" | "tip" | "warning";

const variantClass: Record<Variant, string> = {
  info: "border-sky-200/80 bg-sky-50/50 text-sky-950",
  tip: "border-zinc-200 bg-zinc-50/80 text-zinc-800",
  warning: "border-amber-200/90 bg-amber-50/60 text-amber-950",
};

const titleClass: Record<Variant, string> = {
  info: "text-sky-900",
  tip: "text-zinc-700",
  warning: "text-amber-950",
};

type Props = {
  variant?: Variant;
  title?: string;
  children: ReactNode;
  className?: string;
};

export function DocsCallout({ variant = "info", title, children, className = "" }: Props) {
  return (
    <aside
      className={`rounded-xl border p-5 sm:p-6 ${variantClass[variant]} ${className}`.trim()}
    >
      {title ? (
        <p className={`text-sm font-semibold ${titleClass[variant]}`}>{title}</p>
      ) : null}
      <div className={title ? "mt-2 text-sm leading-relaxed" : "text-sm leading-relaxed"}>
        {children}
      </div>
    </aside>
  );
}
