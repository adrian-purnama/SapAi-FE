"use client";

import { usePathname } from "next/navigation";

import { StandaloneApiSettingsPanel } from "./StandaloneApiSettingsPanel";

/** Shows playground URL + API key on hub and standalone server doc pages only. */
export function StandaloneDocsToolbar() {
  const pathname = usePathname();
  const show =
    pathname === "/docs/api" || pathname.startsWith("/docs/api/server");

  if (!show) return null;

  return (
    <div className="sticky top-16 z-10 min-w-0 bg-zinc-50/95 py-2 backdrop-blur-sm lg:top-[4.25rem]">
      <StandaloneApiSettingsPanel />
    </div>
  );
}
