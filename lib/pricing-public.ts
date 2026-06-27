import { cache } from "react";

import { joinServerApiPath } from "@/lib/server-api";

export type PricingPlanPublic = {
  slug: string;
  name: string;
  description: string;
  priceLabel: string | null;
  priceNote: string | null;
  accentColor: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isPayable: boolean;
};

export type PricingCompareRow = {
  label: string;
  values: string[];
};

export type PricingPublicPayload = {
  plans: PricingPlanPublic[];
  compareRows: PricingCompareRow[];
  cardBullets: string[][];
};

const EMPTY_PAYLOAD: PricingPublicPayload = {
  plans: [],
  compareRows: [],
  cardBullets: [],
};

export async function fetchPublicPricing(): Promise<PricingPublicPayload> {
  try {
    const response = await fetch(joinServerApiPath("/api/v1/pricing/plans"), {
      cache: "no-store",
    });
    if (!response.ok) return EMPTY_PAYLOAD;
    const payload = await response.json();
    const data = payload?.data as PricingPublicPayload | undefined;
    if (!data || !Array.isArray(data.plans)) return EMPTY_PAYLOAD;
    return {
      plans: data.plans.map((p) => ({
        ...p,
        isPayable: Boolean(p.isPayable),
      })),
      compareRows: Array.isArray(data.compareRows) ? data.compareRows : [],
      cardBullets: Array.isArray(data.cardBullets) ? data.cardBullets : [],
    };
  } catch {
    return EMPTY_PAYLOAD;
  }
}

export const getPublicPricingForPage = cache(fetchPublicPricing);
