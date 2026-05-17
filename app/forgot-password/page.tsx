import type { Metadata } from "next";

import ForgotPasswordPageContent from "@/app/forms/forgotPassword/ForgotPasswordPageContent";
import { buildPageMetadata } from "@/lib/site-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "Forgot password",
    description: "Request a password reset link for your SapAi account.",
    path: "/forgot-password",
    noIndex: true,
  });
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordPageContent />;
}

