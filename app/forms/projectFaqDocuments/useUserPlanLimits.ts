"use client";

import { useMemo } from "react";
import { useSapAi } from "@/app/providers/sapai-provider";

const DEFAULT_MAX_PDF_MB = 15;
const DEFAULT_MAX_PDF_COUNT = 5;
const DEFAULT_MAX_MESSAGE_CHARS = 2000;

export function useUserPlanLimits(): {
  maxPdfMb: number;
  maxPdfUpload: number;
  maxBytes: number;
  maxCharacterPerMessage: number;
  planName: string | null;
  loading: boolean;
} {
  const { user, token } = useSapAi();
  const plan = user?.plan;

  return useMemo(() => {
    const maxPdfMb = plan?.maxPdfMb ?? DEFAULT_MAX_PDF_MB;
    const maxPdfUpload = plan?.maxPdfUpload ?? DEFAULT_MAX_PDF_COUNT;

    if (!token) {
      return {
        maxPdfMb,
        maxPdfUpload,
        maxBytes: maxPdfMb * 1024 * 1024,
        maxCharacterPerMessage: DEFAULT_MAX_MESSAGE_CHARS,
        planName: null,
        loading: false,
      };
    }

    if (!user) {
      return {
        maxPdfMb,
        maxPdfUpload,
        maxBytes: maxPdfMb * 1024 * 1024,
        maxCharacterPerMessage: DEFAULT_MAX_MESSAGE_CHARS,
        planName: null,
        loading: true,
      };
    }

    return {
      maxPdfMb,
      maxPdfUpload,
      maxBytes: maxPdfMb * 1024 * 1024,
      maxCharacterPerMessage: plan?.maxCharacterPerMessage ?? DEFAULT_MAX_MESSAGE_CHARS,
      planName: plan?.name ?? null,
      loading: false,
    };
  }, [token, user, plan?.maxPdfMb, plan?.maxPdfUpload, plan?.maxCharacterPerMessage, plan?.name]);
}
