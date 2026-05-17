"use client";

import { useSapAi } from "@/app/providers/sapai-provider";

const DEFAULT_MAX = 2000;

/** Character limit and plan name from the signed-in user's subscription plan. */
export function usePlanMessageLimit(): {
  maxCharacterPerMessage: number;
  planName: string | null;
  loading: boolean;
} {
  const { user, token } = useSapAi();
  const plan = user?.plan;

  if (!token) {
    return { maxCharacterPerMessage: DEFAULT_MAX, planName: null, loading: false };
  }

  if (!user) {
    return { maxCharacterPerMessage: DEFAULT_MAX, planName: null, loading: true };
  }

  return {
    maxCharacterPerMessage: plan?.maxCharacterPerMessage ?? DEFAULT_MAX,
    planName: plan?.name ?? null,
    loading: false,
  };
}
