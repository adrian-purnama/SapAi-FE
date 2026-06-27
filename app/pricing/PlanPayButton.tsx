"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useSapAi } from "@/app/providers/sapai-provider";
import { toastError } from "@/lib/app-toast";
import { joinServerApiPath } from "@/lib/server-api";

const PENDING_PLAN_PAYMENT_KEY = "sapai.pendingPlanPayment";

type PlanPayButtonProps = {
  planSlug: string;
  accentColor: string;
  label?: string;
  className?: string;
};

export default function PlanPayButton({
  planSlug,
  accentColor,
  label = "Upgrade",
  className = "mt-auto inline-flex h-11 w-full items-center justify-center rounded-lg text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60",
}: PlanPayButtonProps) {
  const router = useRouter();
  const { user, token } = useSapAi();
  const [loading, setLoading] = useState(false);
  const resumeStarted = useRef(false);

  const startPayment = useCallback(async (checkoutTab?: Window | null) => {
    if (!token) return false;
    setLoading(true);
    try {
      const response = await fetch(joinServerApiPath("/api/v1/payments/plan"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planSlug }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error?.message ?? "Payment could not be started.");
      }
      const data = payload.data as { redirectUrl?: string };
      const redirectUrl = data.redirectUrl?.trim();
      if (redirectUrl) {
        if (checkoutTab && !checkoutTab.closed) {
          checkoutTab.location.href = redirectUrl;
          checkoutTab.opener = null;
        } else {
          window.open(redirectUrl, "_blank");
        }
        return true;
      }
      throw new Error("Payment redirect URL missing.");
    } catch (err) {
      checkoutTab?.close();
      toastError(err instanceof Error ? err.message : "Payment could not be started.");
      return false;
    } finally {
      setLoading(false);
    }
  }, [planSlug, token]);

  useEffect(() => {
    if (!user || !token || resumeStarted.current) return;
    const pending = sessionStorage.getItem(PENDING_PLAN_PAYMENT_KEY);
    if (pending !== planSlug) return;
    resumeStarted.current = true;
    sessionStorage.removeItem(PENDING_PLAN_PAYMENT_KEY);
    void startPayment();
  }, [user, token, planSlug, startPayment]);

  async function onClick() {
    if (loading) return;
    if (!user || !token) {
      sessionStorage.setItem(PENDING_PLAN_PAYMENT_KEY, planSlug);
      router.push(`/login?from=${encodeURIComponent(`/pricing/${planSlug}`)}`);
      return;
    }
    const checkoutTab = window.open("", "_blank");
    await startPayment(checkoutTab);
  }

  return (
    <button
      type="button"
      className={className}
      style={{ backgroundColor: accentColor }}
      disabled={loading}
      onClick={() => void onClick()}
    >
      {loading ? "Starting checkout…" : label}
    </button>
  );
}
