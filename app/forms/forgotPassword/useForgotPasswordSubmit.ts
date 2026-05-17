"use client";

import { useState } from "react";
import { toastError, toastSuccess } from "@/lib/app-toast";
import { joinServerApiPath } from "@/lib/server-api";

export function useForgotPasswordSubmit() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(email: string): Promise<boolean> {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(joinServerApiPath("/api/v1/auth/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error?.message ?? "Failed to request password reset.");
      }
      setSuccess(payload?.data?.message ?? "If an account exists, a reset code has been sent.");
      toastSuccess(payload?.data?.message ?? "If an account exists, a reset code has been sent.");
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to request password reset.";
      setError(message);
      toastError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }

  return { loading, error, success, submit };
}

