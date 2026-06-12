import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

export function BlogProse({ children, className = "" }: Props) {
  return (
    <div
      className={[
        "text-base leading-relaxed text-zinc-700",
        "[&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-zinc-900",
        "[&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-zinc-900",
        "[&_p]:mt-4 [&_p:first-child]:mt-0",
        "[&_ul]:mt-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6",
        "[&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6",
        "[&_li]:leading-relaxed",
        "[&_a]:font-medium [&_a]:text-sky-800 [&_a]:underline-offset-2 hover:[&_a]:underline",
        "[&_code]:rounded [&_code]:bg-zinc-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm [&_code]:text-zinc-800",
        "[&_blockquote]:mt-4 [&_blockquote]:border-l-4 [&_blockquote]:border-zinc-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-zinc-600",
        "[&_pre]:max-w-full [&_pre]:overflow-x-auto",
        "min-w-0 max-w-full",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
