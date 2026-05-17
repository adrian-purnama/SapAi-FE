"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import PasswordChecklist from "@/app/components/PasswordChecklist";
import PasswordInput from "@/app/components/PasswordInput";
import { useRegisterSubmit } from "./useRegisterSubmit";

type RegisterFormProps = {
  appName?: string;
  brandLogoUrl?: string | null;
};

export default function RegisterForm({ appName, brandLogoUrl }: RegisterFormProps) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [clientError, setClientError] = useState("");
  const {
    loadingOtp,
    loadingRegister,
    requestOtp,
    submitRegister,
  } = useRegisterSubmit();

  async function onRequestOtp(event: FormEvent<HTMLButtonElement>) {
    event.preventDefault();
    setClientError("");
    await requestOtp(email);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setClientError("");
    if (password !== confirmPassword) {
      setClientError("Passwords do not match.");
      return;
    }
    if (!acceptedTerms) {
      setClientError("You must accept the terms and conditions to register.");
      return;
    }
    await submitRegister(email, otp, password);
  }

  return (
    <form
      className="mx-auto my-12 flex w-full max-w-[480px] flex-col gap-3 rounded-xl border border-zinc-300 bg-white p-6"
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
      <h1 className="mb-2 text-2xl font-semibold mx-auto">
        Register
      </h1>

      <label className="text-sm text-zinc-700" htmlFor="register-email">
        Email
      </label>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <input
          id="register-email"
          className="h-10 rounded-lg border border-zinc-300 px-3"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <button
          className="h-[42px] cursor-pointer rounded-lg bg-zinc-800 px-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onRequestOtp}
          disabled={loadingOtp || !email}
          type="button"
        >
          {loadingOtp ? "Sending..." : "Send OTP"}
        </button>
      </div>

      <label className="text-sm text-zinc-700" htmlFor="register-otp">
        OTP
      </label>
      <input
        id="register-otp"
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
        id="register-password"
        label="Password"
        autoComplete="new-password"
        minLength={8}
        value={password}
        onChange={setPassword}
        required
      />
      <PasswordChecklist password={password} />

      <PasswordInput
        id="register-confirm-password"
        label="Confirm password"
        autoComplete="new-password"
        minLength={8}
        value={confirmPassword}
        onChange={setConfirmPassword}
        required
      />

      <div className="flex items-start gap-2 pt-1">
        <input
          id="register-accepted-terms"
          type="checkbox"
          className="mt-1 h-4 w-4 shrink-0 rounded border border-zinc-300"
          checked={acceptedTerms}
          onChange={(event) => setAcceptedTerms(event.target.checked)}
        />
        <label htmlFor="register-accepted-terms" className="text-sm text-zinc-700">
          I agree to the{" "}
          <Link href="/terms" className="font-medium text-zinc-900 underline" target="_blank" rel="noopener noreferrer">
            terms and conditions
          </Link>
          .
        </label>
      </div>

      <button
        className="mt-2 h-[42px] cursor-pointer rounded-lg bg-zinc-900 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        type="submit"
        disabled={loadingRegister}
      >
        {loadingRegister ? "Registering..." : "Register"}
      </button>

      {clientError ? <p className="mt-1 text-red-700">{clientError}</p> : null}
    </form>
  );
}
