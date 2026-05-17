"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useForgotPasswordSubmit } from "./useForgotPasswordSubmit";

type ForgotPasswordFormProps = {
  appName?: string;
  brandLogoUrl?: string | null;
};

export default function ForgotPasswordForm({ appName, brandLogoUrl }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const { loading, submit } = useForgotPasswordSubmit();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submit(email);
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
      <h1 className="mb-1 text-2xl font-semibold mx-auto">
        {appName ? `${appName} ` : null}Reset password
      </h1>
      <p className="mx-auto mb-2 max-w-sm text-center text-sm text-zinc-600">
        Enter your email. If an account exists, we will send a reset code.
      </p>

      <label className="text-sm text-zinc-700" htmlFor="forgot-email">
        Email
      </label>
      <input
        id="forgot-email"
        className="h-10 rounded-lg border border-zinc-300 px-3"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />

      <button
        className="mt-2 h-[42px] cursor-pointer rounded-lg bg-zinc-900 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        type="submit"
        disabled={loading}
      >
        {loading ? "Sending..." : "Send reset code"}
      </button>

      <div className="mt-2 flex flex-wrap justify-between gap-2 text-sm text-zinc-600">
        <Link href="/login" className="hover:text-zinc-900">
          Back to login
        </Link>
        <Link href="/reset-password" className="hover:text-zinc-900">
          I already have a code
        </Link>
      </div>
    </form>
  );
}

