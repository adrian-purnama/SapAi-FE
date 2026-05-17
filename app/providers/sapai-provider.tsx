"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearAuthSession,
  getAuthChangeEventName,
  getAuthSession,
  parseAuthUserPayload,
  setAuthSession,
  type AuthUser,
} from "@/lib/auth-client";
import type { AppPublicConfig } from "@/lib/app-config-public";
import { joinServerApiPath } from "@/lib/server-api";

export type { AppPublicConfig };

type RefreshAppConfigOptions = {
  /** When true, skip toggling appConfigLoading (avoids global UI flicker after saves). */
  silent?: boolean;
};

type SapAiContextValue = {
  user: AuthUser | null;
  token: string | null;
  appConfig: AppPublicConfig | null;
  appConfigLoading: boolean;
  appConfigError: string;
  refreshAppConfig: (options?: RefreshAppConfigOptions) => Promise<void>;
  logout: () => Promise<void>;
};

const SapAiContext = createContext<SapAiContextValue | null>(null);

export function useSapAi() {
  const ctx = useContext(SapAiContext);
  if (!ctx) {
    throw new Error("useSapAi must be used within SapAiProvider");
  }
  return ctx;
}

function readAuthFromStorage() {
  const session = getAuthSession();
  return {
    user: session?.user ?? null,
    token: session?.token ?? null,
  };
}

export function SapAiProvider({ children }: { children: ReactNode }) {
  /**
   * Important: keep the first client render aligned with server HTML.
   * We hydrate auth from localStorage after mount to avoid hydration mismatch.
   */
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [appConfig, setAppConfig] = useState<AppPublicConfig | null>(null);
  const [appConfigLoading, setAppConfigLoading] = useState(true);
  const [appConfigError, setAppConfigError] = useState("");

  const refreshAppConfig = useCallback(async (options?: RefreshAppConfigOptions) => {
    const silent = Boolean(options?.silent);
    if (!silent) {
      setAppConfigLoading(true);
    }
    setAppConfigError("");
    try {
      const response = await fetch(joinServerApiPath("/api/v1/app-config"));
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error?.message ?? "Failed to load app settings.");
      }
      setAppConfig(payload.data as AppPublicConfig);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load app settings.";
      setAppConfigError(message);
    } finally {
      if (!silent) {
        setAppConfigLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      const next = readAuthFromStorage();
      setUser(next.user);
      setToken(next.token);
      if (next.token) {
        void (async () => {
          try {
            const res = await fetch(joinServerApiPath("/api/v1/auth/me"), {
              headers: { Authorization: `Bearer ${next.token}` },
            });
            const payload = await res.json();
            if (!res.ok || !payload?.success || !payload.data) return;
            const merged = parseAuthUserPayload(payload.data);
            if (!merged) return;
            setUser(merged);
            const session = getAuthSession();
            if (session?.token === next.token) {
              setAuthSession({ token: session.token, user: merged });
            }
          } catch {
            // ignore
          }
        })();
      }
    });

    /* Initial public app-config fetch into context (sets loading + data). */
    // eslint-disable-next-line react-hooks/set-state-in-effect -- refreshAppConfig sets loading/data on mount only
    void refreshAppConfig();

    const evt = getAuthChangeEventName();
    const onAuth = () => {
      const next = readAuthFromStorage();
      setUser(next.user);
      setToken(next.token);
    };
    window.addEventListener("storage", onAuth);
    window.addEventListener(evt, onAuth);
    return () => {
      window.removeEventListener("storage", onAuth);
      window.removeEventListener(evt, onAuth);
    };
  }, [refreshAppConfig]);

  const logout = useCallback(async () => {
    await fetch(joinServerApiPath("/api/v1/auth/logout"), { method: "POST" }).catch(() => undefined);
    clearAuthSession();
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      appConfig,
      appConfigLoading,
      appConfigError,
      refreshAppConfig,
      logout,
    }),
    [user, token, appConfig, appConfigLoading, appConfigError, refreshAppConfig, logout],
  );

  return <SapAiContext.Provider value={value}>{children}</SapAiContext.Provider>;
}
