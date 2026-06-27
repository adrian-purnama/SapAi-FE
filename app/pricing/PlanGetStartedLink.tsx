"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { useSapAi } from "@/app/providers/sapai-provider";

type PlanGetStartedLinkProps = {
  accentColor: string;
  className?: string;
  withArrow?: boolean;
};

export default function PlanGetStartedLink({
  accentColor,
  className = "mt-auto inline-flex h-11 w-full items-center justify-center rounded-lg text-sm font-semibold text-white transition hover:opacity-90",
  withArrow = false,
}: PlanGetStartedLinkProps) {
  const { user } = useSapAi();
  const href = user ? "/dashboard" : "/register";
  const label = user ? "Go to dashboard" : "Get started";

  return (
    <Link href={href} className={className} style={{ backgroundColor: accentColor }}>
      {label}
      {withArrow ? <ArrowRight className="ml-2 h-4 w-4" aria-hidden /> : null}
    </Link>
  );
}
