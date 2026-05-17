"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import PasswordChecklist from "@/app/components/PasswordChecklist";
import PasswordInput from "@/app/components/PasswordInput";
import { useResetPasswordSubmit } from "./useResetPasswordSubmit";

type ResetPasswordFormProps = {
  appName?: string;
  brandLogoUrl?: string | null;
};

export default function ResetPasswordForm({ appName, brandLogoUrl }: ResetPasswordFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [clientError, setClientError] = useState("");
  const { loading, submit } = useResetPasswordSubmit();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setClientError("");
    if (newPassword !== confirmPassword) {
      setClientError("Passwords do not match.");
      return;
    }
    const ok = await submit(email, otp, newPassword);
    if (ok) {
      router.replace("/login");
    }
  }

  return (
    <form
      className="mx-auto my-12 flex w-full max-w-[520px] flex-col gap-3 rounded-xl border border-zinc-300 bg-white p-6"
      onSubmit={onSubmit}
    >
      {brandLogoUrl ? (
        <div className="mb-4 flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- config-driven branding URL */}
          <img
            src={brandLogoUrl}
            alt=""
            className="h-14 max-w-[220px] object-contain"
            width={220}
            height={56}
          />
        </div>
      ) : null}
      <h1 className="mb-1 text-2xl font-semibold mx-auto">
        {appName ? `${appName} ` : null}Set a new password
      </h1>
      <p className="mx-auto mb-2 max-w-md text-center text-sm text-zinc-600">
        Enter the reset code from your email, then choose a new password.
      </p>

      <label className="text-sm text-zinc-700" htmlFor="reset-email">
        Email
      </label>
      <input
        id="reset-email"
        className="h-10 rounded-lg border border-zinc-300 px-3"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />

      <label className="text-sm text-zinc-700" htmlFor="reset-otp">
        Reset code (OTP)
      </label>
      <input
        id="reset-otp"
        className="h-10 rounded-lg border border-zinc-300 px-3"
        type="text"
        inputMode="numeric"
        pattern="[0-9]{6}"
        maxLength={6}
        value={otp}
        onChange={(event) => setOtp(event.target.value)}
        required
      />

      <PasswordInput
        id="reset-password"
        label="New password"
        autoComplete="new-password"
        minLength={8}
        value={newPassword}
        onChange={setNewPassword}
        required
      />
      <PasswordChecklist password={newPassword} />

      <PasswordInput
        id="reset-confirm-password"
        label="Confirm new password"
        autoComplete="new-password"
        minLength={8}
        value={confirmPassword}
        onChange={setConfirmPassword}
        required
      />

      <button
        className="mt-2 h-[42px] cursor-pointer rounded-lg bg-zinc-900 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        type="submit"
        disabled={loading}
      >
        {loading ? "Saving..." : "Reset password"}
      </button>

      {clientError ? <p className="mt-1 text-red-700">{clientError}</p> : null}

      <div className="mt-2 flex flex-wrap justify-between gap-2 text-sm text-zinc-600">
        <Link href="/forgot-password" className="hover:text-zinc-900">
          Need a code?
        </Link>
        <Link href="/login" className="hover:text-zinc-900">
          Back to login
        </Link>
      </div>
    </form>
  );
}

