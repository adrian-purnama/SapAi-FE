import type { Metadata } from "next";
import type { ReactNode } from "react";

import { buildPageMetadata } from "@/lib/site-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "Admin",
    description: "SapAi administration.",
    path: "/admin",
    noIndex: true,
  });
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
