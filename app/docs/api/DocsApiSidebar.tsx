"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { API_DOCS_NAV, type DocsNavItem } from "./docsNav";

function readHash(): string {
  if (typeof window === "undefined") return "";
  return window.location.hash;
}

export function DocsApiSidebar() {
  const pathname = usePathname();
  const [hash, setHash] = useState(readHash);

  useEffect(() => {
    const sync = () => setHash(readHash());
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [pathname]);

  function linkClass(href: string, active: boolean): string {
    return [
      "block rounded-md border-l-2 py-1.5 pl-3 pr-2 text-sm transition-colors",
      active
        ? "border-zinc-900 bg-zinc-100/80 font-medium text-zinc-900"
        : "border-transparent text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900",
    ].join(" ");
  }

  function subLinkClass(active: boolean): string {
    return [
      "block rounded-md border-l-2 py-1 pl-3 pr-2 text-[13px] transition-colors",
      active
        ? "border-sky-600 bg-sky-50/80 font-medium text-sky-950"
        : "border-transparent text-zinc-500 hover:border-zinc-200 hover:bg-zinc-50 hover:text-zinc-800",
    ].join(" ");
  }

  function isParentActive(item: DocsNavItem): boolean {
    if (pathname !== item.href) return false;
    if (!item.subItems?.length) return true;
    return hash === "" || hash === "#";
  }

  function isSubActive(item: DocsNavItem, subHash: string): boolean {
    return pathname === item.href && hash === `#${subHash}`;
  }

  function renderNavItem(item: DocsNavItem) {
    const parentActive = isParentActive(item);
    const hasSubItems = (item.subItems?.length ?? 0) > 0;

    return (
      <li key={item.href}>
        <Link href={item.href} className={linkClass(item.href, parentActive)}>
          {item.label}
        </Link>
        {hasSubItems ? (
          <ul className="mt-1 space-y-0.5 border-l border-zinc-200 ml-3 pl-1">
            {item.subItems!.map((sub) => (
              <li key={sub.hash}>
                <Link
                  href={`${item.href}#${sub.hash}`}
                  className={subLinkClass(isSubActive(item, sub.hash))}
                >
                  {sub.label}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </li>
    );
  }

  return (
    <aside className="lg:w-52 lg:shrink-0 lg:sticky lg:top-28 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:border-r lg:border-zinc-200 lg:pr-6">
      <nav aria-label="API documentation" className="flex flex-col gap-8">
        {API_DOCS_NAV.map((section) => (
          <div key={section.group}>
            {section.group === "Overview" ? (
              <Link href="/docs/api" className={linkClass("/docs/api", pathname === "/docs/api")}>
                Overview
              </Link>
            ) : (
              <>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  {section.group}
                </p>
                <ul className="space-y-0.5">{section.items.map((item) => renderNavItem(item))}</ul>
              </>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
