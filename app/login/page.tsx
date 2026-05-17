import type { Metadata } from "next";

import LoginPageContent from "@/app/forms/login/LoginPageContent";
import { buildPageMetadata } from "@/lib/site-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "Log in",
    description: "Sign in to your SapAi account.",
    path: "/login",
    noIndex: true,
  });
}

export default function LoginPage() {
  return <LoginPageContent />;
}
