import { cache } from "react";

import { joinServerApiPath } from "@/lib/server-api";

export type AppPublicConfig = {
  appName: string;
  openRegistration: boolean;
  openLogin: boolean;
  brandLogoFileId: string | null;
  brandLogoUrl: string | null;
};

const DEFAULT_APP_NAME = "SapAi";

function fallbackPublicAppConfig(): AppPublicConfig {
  return {
    appName: DEFAULT_APP_NAME,
    openRegistration: true,
    openLogin: true,
    brandLogoFileId: null,
    brandLogoUrl: null,
  };
}

export async function fetchPublicAppConfig(): Promise<AppPublicConfig> {
  try {
    const response = await fetch(joinServerApiPath("/api/v1/app-config"), {
      cache: "no-store",
    });
    if (!response.ok) {
      return fallbackPublicAppConfig();
    }
    const payload = await response.json();
    const data = payload?.data as
      | {
          appName?: string;
          openRegistration?: boolean;
          openLogin?: boolean;
          brandLogoFileId?: string | null;
          brandLogoUrl?: string | null;
        }
      | undefined;

    const appName = data?.appName?.trim() || DEFAULT_APP_NAME;
    const brandLogoFileId =
      typeof data?.brandLogoFileId === "string" && data.brandLogoFileId.trim() !== ""
        ? data.brandLogoFileId.trim()
        : null;
    const brandLogoUrl =
      typeof data?.brandLogoUrl === "string" && data.brandLogoUrl.trim() !== ""
        ? data.brandLogoUrl.trim()
        : brandLogoFileId
          ? joinServerApiPath(`/api/v1/files/${brandLogoFileId}`)
          : null;

    return {
      appName,
      openRegistration: data?.openRegistration !== false,
      openLogin: data?.openLogin !== false,
      brandLogoFileId,
      brandLogoUrl,
    };
  } catch {
    return fallbackPublicAppConfig();
  }
}

export const getPublicAppConfigForMetadata = cache(fetchPublicAppConfig);
