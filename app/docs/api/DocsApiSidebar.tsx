"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { API_DOCS_NAV } from "./docsNav";

export function DocsApiSidebar() {
  const pathname = usePathname();

  function linkClass(href: string): string {
    const active = pathname === href;
    return [
      "block rounded-md px-2 py-1.5 text-sm transition-colors",
      active ? "bg-zinc-200 font-medium text-zinc-900" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
    ].join(" ");
  }

  return (
    <aside className="lg:w-56 lg:shrink-0 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto">
      <nav
        aria-label="API documentation"
        className="flex flex-col gap-6 rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 lg:border-zinc-200"
      >
        {API_DOCS_NAV.map((section) => (
          <div key={section.group}>
            {section.group === "Overview" ? (
              <Link href="/docs/api" className={linkClass("/docs/api")}>
                Overview
              </Link>
            ) : (
              <>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {section.group}
                </p>
                <ul className="space-y-0.5">
                  {section.items.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className={linkClass(item.href)}>
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
