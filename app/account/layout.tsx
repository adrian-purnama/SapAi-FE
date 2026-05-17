import type { Metadata } from "next";
import type { ReactNode } from "react";

import { buildPageMetadata } from "@/lib/site-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "Account",
    description: "View your SapAi profile and change your password.",
    path: "/account",
    noIndex: true,
  });
}

export default function AccountLayout({ children }: { children: ReactNode }) {
  return children;
}
