"use client";

import { useMemo } from "react";
import { useSapAi } from "@/app/providers/sapai-provider";

const DEFAULT_MAX_PDF_MB = 15;
const DEFAULT_MAX_PDF_COUNT = 5;

export function useFaqPlanLimits() {
  const { user } = useSapAi();

  return useMemo(() => {
    const maxPdfMb = user?.plan?.maxPdfMb ?? DEFAULT_MAX_PDF_MB;
    const maxPdfUpload = user?.plan?.maxPdfUpload ?? DEFAULT_MAX_PDF_COUNT;
    return {
      maxPdfMb,
      maxPdfUpload,
      maxBytes: maxPdfMb * 1024 * 1024,
    };
  }, [user?.plan?.maxPdfMb, user?.plan?.maxPdfUpload]);
}
