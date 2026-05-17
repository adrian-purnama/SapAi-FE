import Link from "next/link";
import type { ReactNode } from "react";

import { ApiDocsSettingsProvider } from "@/app/docs/components/ApiDocsSettingsProvider";
import { StandaloneDocsToolbar } from "@/app/docs/components/StandaloneDocsToolbar";

import { DocsApiSidebar } from "./DocsApiSidebar";

export default function DocsApiLayout({ children }: { children: ReactNode }) {
  return (
    <ApiDocsSettingsProvider>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-sm font-medium text-zinc-500">
          <Link href="/" className="hover:text-zinc-800">
            Home
          </Link>
          <span className="mx-2 text-zinc-300">/</span>
          <Link href="/docs/api" className="hover:text-zinc-800">
            Docs
          </Link>
          <span className="mx-2 text-zinc-300">/</span>
          <span className="text-zinc-800">API</span>
        </p>

        <StandaloneDocsToolbar />

        <div className="mt-6 flex flex-col gap-10 lg:flex-row lg:gap-12">
          <DocsApiSidebar />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </ApiDocsSettingsProvider>
  );
}
