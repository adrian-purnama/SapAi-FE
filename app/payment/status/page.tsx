import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

import { buildPageMetadata } from "@/lib/site-metadata";

type PageProps = {
  searchParams: Promise<{
    paymentId?: string;
    status?: string;
    isPaid?: string;
    planSlug?: string;
    error?: string;
  }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "Payment status",
    description: "Your plan payment result.",
    path: "/payment/status",
    noIndex: true,
  });
}

function planLabel(slug: string | undefined): string {
  if (!slug?.trim()) return "your plan";
  return slug.trim().replace(/-/g, " ");
}

export default async function PaymentStatusPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const error = query.error?.trim();
  const paymentId = query.paymentId?.trim();
  const status = query.status?.trim().toLowerCase() ?? "";
  const planSlug = query.planSlug?.trim();
  const isPaid = query.isPaid === "1";

  if (error === "missing_order") {
    return (
      <StatusShell
        icon={<XCircle className="h-12 w-12 text-red-600" aria-hidden />}
        title="Payment reference missing"
        message="We could not identify this payment. If you completed checkout, check your email or try again from pricing."
        primaryHref="/pricing"
        primaryLabel="View pricing"
      />
    );
  }

  if (error === "not_found") {
    return (
      <StatusShell
        icon={<XCircle className="h-12 w-12 text-red-600" aria-hidden />}
        title="Payment not found"
        message="This payment record could not be found. Contact support if money was deducted."
        primaryHref="/pricing"
        primaryLabel="View pricing"
      />
    );
  }

  if (isPaid || status === "settlement" || status === "capture") {
    return (
      <StatusShell
        icon={<CheckCircle2 className="h-12 w-12 text-emerald-600" aria-hidden />}
        title="Payment successful"
        message={`Your payment for ${planLabel(planSlug)} was received. Your plan upgrade may take a moment to apply.`}
        detail={paymentId ? `Reference: ${paymentId}` : undefined}
        primaryHref="/dashboard"
        primaryLabel="Go to dashboard"
        secondaryHref="/account"
        secondaryLabel="Account"
      />
    );
  }

  if (status === "pending" || status === "challenge") {
    return (
      <StatusShell
        icon={<Clock className="h-12 w-12 text-amber-600" aria-hidden />}
        title="Payment pending"
        message="Your payment is still being processed. This page will update once Midtrans confirms settlement."
        detail={paymentId ? `Reference: ${paymentId}` : undefined}
        primaryHref="/pricing"
        primaryLabel="Back to pricing"
      />
    );
  }

  if (status === "deny" || status === "cancel" || status === "expire" || status === "failure") {
    return (
      <StatusShell
        icon={<XCircle className="h-12 w-12 text-red-600" aria-hidden />}
        title="Payment not completed"
        message={`Checkout for ${planLabel(planSlug)} did not finish (${status || "unknown"}). You can try again from pricing.`}
        primaryHref={`/pricing/${planSlug ?? ""}`.replace(/\/$/, "") || "/pricing"}
        primaryLabel="Try again"
        secondaryHref="/pricing"
        secondaryLabel="All plans"
      />
    );
  }

  return (
    <StatusShell
      icon={<Clock className="h-12 w-12 text-zinc-500" aria-hidden />}
      title="Payment status"
      message="We received your return from checkout. If payment succeeded, your plan will update shortly."
      detail={[paymentId && `Reference: ${paymentId}`, status && `Status: ${status}`].filter(Boolean).join(" · ") || undefined}
      primaryHref="/dashboard"
      primaryLabel="Go to dashboard"
      secondaryHref="/pricing"
      secondaryLabel="Pricing"
    />
  );
}

function StatusShell({
  icon,
  title,
  message,
  detail,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  icon: ReactNode;
  title: string;
  message: string;
  detail?: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <main className="px-6 py-16">
      <div className="mx-auto max-w-md rounded-xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <div className="flex justify-center">{icon}</div>
        <h1 className="mt-4 text-xl font-semibold text-zinc-900">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">{message}</p>
        {detail ? <p className="mt-3 text-xs text-zinc-500">{detail}</p> : null}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href={primaryHref}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-zinc-900 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            {primaryLabel}
          </Link>
          {secondaryHref && secondaryLabel ? (
            <Link
              href={secondaryHref}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-zinc-300 px-5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
            >
              {secondaryLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </main>
  );
}
