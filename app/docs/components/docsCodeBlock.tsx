export function CodeBlock({ title, children }: { title?: string; children: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-950">
      {title ? (
        <div className="border-b border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-400">
          {title}
        </div>
      ) : null}
      <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-zinc-100">
        {children.trim()}
      </pre>
    </div>
  );
}
