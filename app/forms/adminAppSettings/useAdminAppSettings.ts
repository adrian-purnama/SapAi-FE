"use client";

import { useEffect, useState } from "react";
import { useSapAi } from "@/app/providers/sapai-provider";
import { toastError, toastSuccess } from "@/lib/app-toast";
import { joinServerApiPath } from "@/lib/server-api";

export type AppSettingsPayload = {
  appName: string;
  openRegistration: boolean;
  openLogin: boolean;
  brandLogoFile: File | null;
  removeBrandLogo: boolean;
  brandLogoUrl: string | null;
};

export function useAdminAppSettings() {
  const { appConfig, appConfigLoading, appConfigError, refreshAppConfig, token } = useSapAi();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!appConfigLoading && !appConfig && appConfigError) {
      toastError(appConfigError, { id: "admin-app-config-load" });
    }
  }, [appConfigLoading, appConfig, appConfigError]);

  async function saveSettings(next: AppSettingsPayload) {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.set("appName", next.appName);
      formData.set("openRegistration", String(next.openRegistration));
      formData.set("openLogin", String(next.openLogin));
      formData.set("removeBrandLogo", String(next.removeBrandLogo));
      if (next.brandLogoFile) {
        formData.set("brandLogo", next.brandLogoFile);
      }

      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(joinServerApiPath("/api/v1/admin/app-config"), {
        method: "PATCH",
        headers,
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error?.message ?? "Save failed.");
      }
      toastSuccess("Settings saved.", { id: "admin-app-config-save" });
      await refreshAppConfig({ silent: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed.";
      toastError(message, { id: "admin-app-config-save" });
    } finally {
      setSaving(false);
    }
  }

  const combinedError = !appConfig && appConfigError ? appConfigError : "";

  return {
    loading: appConfigLoading,
    saving,
    loadError: combinedError,
    settings: appConfig,
    saveSettings,
  };
}
