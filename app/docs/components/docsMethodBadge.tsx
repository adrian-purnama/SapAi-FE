export function methodBadgeClass(method: string): string {
  const base = "shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase";
  switch (method) {
    case "GET":
      return `${base} bg-emerald-100 text-emerald-900`;
    case "POST":
      return `${base} bg-sky-100 text-sky-900`;
    case "PATCH":
      return `${base} bg-amber-100 text-amber-900`;
    case "PUT":
      return `${base} bg-violet-100 text-violet-900`;
    case "DELETE":
      return `${base} bg-rose-100 text-rose-900`;
    default:
      return `${base} bg-zinc-200 text-zinc-800`;
  }
}

export function MethodBadge({ method }: { method: string }) {
  return <span className={methodBadgeClass(method)}>{method}</span>;
}
