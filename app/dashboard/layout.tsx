import type { Metadata } from "next";
import type { ReactNode } from "react";

import { buildPageMetadata } from "@/lib/site-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "Dashboard",
    description: "Manage API keys, usage, and projects in your SapAi dashboard.",
    path: "/dashboard",
    noIndex: true,
  });
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return children;
}
