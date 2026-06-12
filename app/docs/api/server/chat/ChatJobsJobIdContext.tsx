"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

const DEFAULT_JOB_ID = "507f1f77bcf86cd799439011";

type ChatJobsJobIdContextValue = {
  jobId: string;
  setJobId: (id: string) => void;
  defaultJobId: string;
};

const ChatJobsJobIdContext = createContext<ChatJobsJobIdContextValue | null>(null);

export function ChatJobsJobIdProvider({ children }: { children: ReactNode }) {
  const [jobId, setJobIdState] = useState(DEFAULT_JOB_ID);

  const setJobId = useCallback((id: string) => {
    const trimmed = id.trim();
    if (trimmed) setJobIdState(trimmed);
  }, []);

  const value = useMemo(
    () => ({ jobId, setJobId, defaultJobId: DEFAULT_JOB_ID }),
    [jobId, setJobId],
  );

  return <ChatJobsJobIdContext.Provider value={value}>{children}</ChatJobsJobIdContext.Provider>;
}

export function useChatJobsJobId(): ChatJobsJobIdContextValue {
  const ctx = useContext(ChatJobsJobIdContext);
  if (!ctx) {
    throw new Error("useChatJobsJobId must be used within ChatJobsJobIdProvider");
  }
  return ctx;
}
