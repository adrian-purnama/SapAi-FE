"use client";

import { useState } from "react";
import { parseAuthUserPayload, setAuthSession, type AuthUser } from "@/lib/auth-client";
import { toastError, toastSuccess } from "@/lib/app-toast";
import { joinServerApiPath } from "@/lib/server-api";

type LoginResult = {
  token: string;
  user: AuthUser;
};

export function useLoginSubmit() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [result, setResult] = useState<LoginResult | null>(null);

  async function submitLogin(email: string, password: string): Promise<boolean> {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(joinServerApiPath("/api/v1/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const payload = await response.json();

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error?.message ?? "Login failed.");
      }

      const data = payload.data as { token?: string; user?: unknown };
      const token = typeof data.token === "string" ? data.token : "";
      const user = parseAuthUserPayload(data.user);
      if (!token || !user) {
        throw new Error("Invalid login response.");
      }
      const session = { token, user };
      setResult(session);
      setAuthSession(session);
      setSuccess("Login successful.");
      toastSuccess("Logged in.");
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed.";
      setError(message);
      toastError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }

  return { loading, error, success, result, submitLogin };
}
