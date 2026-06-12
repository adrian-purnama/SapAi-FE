import type { ReactNode } from "react";

type Props = {
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function DocsPageHeader({ title, description, children, className = "" }: Props) {
  return (
    <header className={`space-y-4 ${className}`.trim()}>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">{title}</h1>
        {description ? (
          <div className="mt-3 max-w-2xl text-base leading-relaxed text-zinc-600">{description}</div>
        ) : null}
      </div>
      {children}
    </header>
  );
}
