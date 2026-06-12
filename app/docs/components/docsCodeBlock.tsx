type Variant = "default" | "request" | "response";

const variantBorder: Record<Variant, string> = {
  default: "border-zinc-200",
  request: "border-l-4 border-l-sky-500 border-zinc-200",
  response: "border-l-4 border-l-emerald-500 border-zinc-200",
};

export function CodeBlock({
  title,
  children,
  variant = "default",
}: {
  title?: string;
  children: string;
  variant?: Variant;
}) {
  return (
    <div
      className={`max-w-full min-w-0 overflow-hidden rounded-lg border bg-zinc-950 ${variantBorder[variant]}`}
    >
      {title ? (
        <div className="border-b border-zinc-800 px-3 py-2 text-xs font-medium text-zinc-400">
          {title}
        </div>
      ) : null}
      <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-zinc-100 sm:p-5 sm:text-[13px] sm:leading-relaxed">
        {children.trim()}
      </pre>
    </div>
  );
}
