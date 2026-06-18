export type AdminPlan = {
  id: string;
  slug: string;
  name: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
  isDefault: boolean;
  isPriority: boolean;
  rateLimitPerMinute: number;
  maxCharacterPerMessage: number;
  maxChatInFlight: number;
  maxApiKeys: number;
  maxPdfUpload: number;
  maxPdfMb: number;
  analyticsRetentionDays: number;
  isAutoEmbed: boolean;
  embedBadgeCustomizable: boolean;
  ragAnalyticsEnabled: boolean;
  priceLabel: string | null;
  priceNote: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AdminPlanInput = {
  slug: string;
  name: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
  isDefault: boolean;
  isPriority: boolean;
  rateLimitPerMinute: number;
  maxCharacterPerMessage: number;
  maxChatInFlight: number;
  maxApiKeys: number;
  maxPdfUpload: number;
  maxPdfMb: number;
  analyticsRetentionDays: number;
  isAutoEmbed: boolean;
  embedBadgeCustomizable: boolean;
  ragAnalyticsEnabled: boolean;
  priceLabel: string;
  priceNote: string;
};

export const EMPTY_PLAN_INPUT: AdminPlanInput = {
  slug: "",
  name: "",
  description: "",
  isActive: true,
  sortOrder: 0,
  isDefault: false,
  isPriority: false,
  rateLimitPerMinute: 10,
  maxCharacterPerMessage: 2000,
  maxChatInFlight: 5,
  maxApiKeys: 1,
  maxPdfUpload: 1,
  maxPdfMb: 1,
  analyticsRetentionDays: 1,
  isAutoEmbed: false,
  embedBadgeCustomizable: false,
  ragAnalyticsEnabled: false,
  priceLabel: "",
  priceNote: "",
};

export function planToInput(plan: AdminPlan): AdminPlanInput {
  return {
    slug: plan.slug,
    name: plan.name,
    description: plan.description,
    isActive: plan.isActive,
    sortOrder: plan.sortOrder,
    isDefault: plan.isDefault,
    isPriority: plan.isPriority,
    rateLimitPerMinute: plan.rateLimitPerMinute,
    maxCharacterPerMessage: plan.maxCharacterPerMessage,
    maxChatInFlight: plan.maxChatInFlight,
    maxApiKeys: plan.maxApiKeys,
    maxPdfUpload: plan.maxPdfUpload,
    maxPdfMb: plan.maxPdfMb,
    analyticsRetentionDays: plan.analyticsRetentionDays,
    isAutoEmbed: plan.isAutoEmbed,
    embedBadgeCustomizable: plan.embedBadgeCustomizable,
    ragAnalyticsEnabled: plan.ragAnalyticsEnabled,
    priceLabel: plan.priceLabel ?? "",
    priceNote: plan.priceNote ?? "",
  };
}

export function inputToCreateBody(input: AdminPlanInput) {
  return {
    slug: input.slug.trim().toLowerCase(),
    name: input.name.trim(),
    description: input.description.trim(),
    isActive: input.isActive,
    sortOrder: input.sortOrder,
    isDefault: input.isDefault,
    isPriority: input.isPriority,
    rateLimitPerMinute: input.rateLimitPerMinute,
    maxCharacterPerMessage: input.maxCharacterPerMessage,
    maxChatInFlight: input.maxChatInFlight,
    maxApiKeys: input.maxApiKeys,
    maxPdfUpload: input.maxPdfUpload,
    maxPdfMb: input.maxPdfMb,
    analyticsRetentionDays: input.analyticsRetentionDays,
    isAutoEmbed: input.isAutoEmbed,
    embedBadgeCustomizable: input.embedBadgeCustomizable,
    ragAnalyticsEnabled: input.ragAnalyticsEnabled,
    priceLabel: input.priceLabel.trim() || null,
    priceNote: input.priceNote.trim() || null,
  };
}

export function inputToPatchBody(input: AdminPlanInput) {
  const body = inputToCreateBody(input);
  const { slug: _slug, ...rest } = body;
  return rest;
}
