import type { Metadata } from "next";

import RegisterPageContent from "@/app/forms/register/RegisterPageContent";
import { buildPageMetadata } from "@/lib/site-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "Create account",
    description: "Register for SapAi and start building with the API.",
    path: "/register",
    noIndex: true,
  });
}

export default function RegisterPage() {
  return <RegisterPageContent />;
}
