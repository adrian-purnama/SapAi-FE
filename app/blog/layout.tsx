import type { ReactNode } from "react";

export default function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[60vh] overflow-x-clip bg-zinc-50/50">
      <div className="mx-auto min-w-0 w-full max-w-5xl px-4 py-12">{children}</div>
    </div>
  );
}
