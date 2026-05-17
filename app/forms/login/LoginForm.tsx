"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import PasswordInput from "@/app/components/PasswordInput";
import { useLoginSubmit } from "./useLoginSubmit";

/** Avoid open redirects: only same-app relative paths. */
function safePostLoginPath(from: string | null): string {
  if (!from || !from.startsWith("/") || from.startsWith("//")) return "/dashboard";
  return from;
}

type LoginFormProps = {
  appName?: string;
  brandLogoUrl?: string | null;
};

export default function LoginForm({ appName, brandLogoUrl }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { loading, submitLogin } = useLoginSubmit();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ok = await submitLogin(email, password);
    if (ok) {
      router.replace(safePostLoginPath(searchParams.get("from")));
    }
  }

  return (
    <form
      className="mx-auto my-12 flex w-full max-w-[420px] flex-col gap-3 rounded-xl border border-zinc-300 bg-white p-6"
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
        Login
      </h1>

      <label className="text-sm text-zinc-700" htmlFor="login-email">
        Email
      </label>
      <input
        id="login-email"
        className="h-10 rounded-lg border border-zinc-300 px-3"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />

      <PasswordInput
        id="login-password"
        label="Password"
        autoComplete="current-password"
        value={password}
        onChange={setPassword}
        required
      />

      <div className="-mt-1 flex justify-end">
        <Link href="/forgot-password" className="text-sm text-zinc-600 hover:text-zinc-900">
          Forgot password?
        </Link>
      </div>

      <button
        className="mt-2 h-[42px] cursor-pointer rounded-lg bg-zinc-900 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        type="submit"
        disabled={loading}
      >
        {loading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
