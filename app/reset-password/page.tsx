import type { Metadata } from "next";

import ResetPasswordPageContent from "@/app/forms/resetPassword/ResetPasswordPageContent";
import { buildPageMetadata } from "@/lib/site-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "Reset password",
    description: "Set a new password for your SapAi account.",
    path: "/reset-password",
    noIndex: true,
  });
}

export default function ResetPasswordPage() {
  return <ResetPasswordPageContent />;
}

