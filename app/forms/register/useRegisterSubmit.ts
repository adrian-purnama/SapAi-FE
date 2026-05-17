"use client";

import { useState } from "react";
import { setAuthSession } from "@/lib/auth-client";
import { toastError, toastSuccess } from "@/lib/app-toast";
import { joinServerApiPath } from "@/lib/server-api";

type RegisterResult = {
  id: string;
  email: string;
  isAdmin: boolean;
  isEmailVerified: boolean;
};

export function useRegisterSubmit() {
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [loadingRegister, setLoadingRegister] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [result, setResult] = useState<RegisterResult | null>(null);

  async function requestOtp(email: string) {
    setLoadingOtp(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(joinServerApiPath("/api/v1/auth/request-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error?.message ?? "Failed to request OTP.");
      }
      setSuccess("OTP sent to your email.");
      toastSuccess("OTP sent to your email.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to request OTP.";
      setError(message);
      toastError(message);
    } finally {
      setLoadingOtp(false);
    }
  }

  async function submitRegister(email: string, otp: string, password: string) {
    setLoadingRegister(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(joinServerApiPath("/api/v1/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, password, acceptedTerms: true }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error?.message ?? "Registration failed.");
      }

      const loginResponse = await fetch(joinServerApiPath("/api/v1/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const loginPayload = await loginResponse.json();
      if (!loginResponse.ok || !loginPayload?.success) {
        throw new Error(loginPayload?.error?.message ?? "Auto-login failed.");
      }

      setAuthSession(loginPayload.data);
      setResult(payload.data);
      setSuccess("Registration complete. You are now logged in.");
      toastSuccess("Registration complete. You are now logged in.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed.";
      setError(message);
      toastError(message);
    } finally {
      setLoadingRegister(false);
    }
  }

  return {
    loadingOtp,
    loadingRegister,
    error,
    success,
    result,
    requestOtp,
    submitRegister,
  };
}
