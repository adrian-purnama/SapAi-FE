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
    <div className="mb-8">
      <StandaloneApiSettingsPanel />
    </div>
  );
}
