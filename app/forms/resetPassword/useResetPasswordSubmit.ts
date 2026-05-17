"use client";

import { useState } from "react";
import { joinServerApiPath } from "@/lib/server-api";
import { toastError, toastSuccess } from "@/lib/app-toast";

export function useResetPasswordSubmit() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(email: string, otp: string, newPassword: string): Promise<boolean> {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(joinServerApiPath("/api/v1/auth/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error?.message ?? "Failed to reset password.");
      }

      setSuccess(payload?.data?.message ?? "Password reset successful.");
      toastSuccess(payload?.data?.message ?? "Password reset successful.");
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to reset password.";
      setError(message);
      toastError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }

  return { loading, error, success, submit };
}

