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

const STORAGE_BASE = "sapai_docs_standalone_base_url";
const STORAGE_KEY = "sapai_docs_standalone_api_key";

function readEnvDefaultBase(): string {
  return (
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_STANDALONE_API_URL?.trim()) ||
    "http://localhost:8000"
  );
}

export type ApiDocsSettingsContextValue = {
  baseUrl: string;
  setBaseUrl: (v: string) => void;
  apiKey: string;
  setApiKey: (v: string) => void;
  hydrated: boolean;
  defaultBaseUrl: string;
};

const ApiDocsSettingsContext = createContext<ApiDocsSettingsContextValue | null>(null);

export function ApiDocsSettingsProvider({ children }: { children: ReactNode }) {
  // Keep server render == first client render (avoid localStorage reads during SSR).
  const [baseUrl, setBaseUrlState] = useState(readEnvDefaultBase());
  const [apiKey, setApiKeyState] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const def = readEnvDefaultBase();
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBaseUrlState(localStorage.getItem(STORAGE_BASE)?.trim() || def);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setApiKeyState(localStorage.getItem(STORAGE_KEY) ?? "");
    } catch {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBaseUrlState(def);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setApiKeyState("");
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  const setBaseUrl = useCallback((v: string) => {
    setBaseUrlState(v);
    try {
      localStorage.setItem(STORAGE_BASE, v);
    } catch {
      /* ignore */
    }
  }, []);

  const setApiKey = useCallback((v: string) => {
    setApiKeyState(v);
    try {
      localStorage.setItem(STORAGE_KEY, v);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({
      baseUrl,
      setBaseUrl,
      apiKey,
      setApiKey,
      hydrated,
      defaultBaseUrl: readEnvDefaultBase(),
    }),
    [baseUrl, setBaseUrl, apiKey, setApiKey, hydrated],
  );

  return (
    <ApiDocsSettingsContext.Provider value={value}>{children}</ApiDocsSettingsContext.Provider>
  );
}

export function useApiDocsSettings(): ApiDocsSettingsContextValue {
  const ctx = useContext(ApiDocsSettingsContext);
  if (!ctx) {
    throw new Error("useApiDocsSettings must be used within ApiDocsSettingsProvider");
  }
  return ctx;
}
