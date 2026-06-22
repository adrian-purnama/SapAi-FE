"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useSapAi } from "@/app/providers/sapai-provider";
import { toastError } from "@/lib/app-toast";
import RegisterForm from "./RegisterForm";

export default function RegisterPageContent() {
  const { appConfig, appConfigLoading, appConfigError } = useSapAi();

  useEffect(() => {
    if (!appConfigLoading && !appConfig && appConfigError) {
      toastError(appConfigError, { id: "app-config-auth" });
    }
  }, [appConfigLoading, appConfig, appConfigError]);

  if (appConfigLoading && !appConfig) {
    return (
      <main className="px-6 py-10">
        <p className="mx-auto max-w-[480px] text-center text-zinc-600">Loading…</p>
      </main>
    );
  }

  if (appConfigError && !appConfig) {
    return (
      <main className="px-6 py-10">
        <p className="mx-auto max-w-[480px] text-center text-sm text-zinc-600">
          Could not load registration configuration.
        </p>
      </main>
    );
  }

  if (!appConfig) {
    return (
      <main className="px-6 py-10">
        <p className="mx-auto max-w-[480px] text-center text-zinc-600">Loading…</p>
      </main>
    );
  }

  if (!appConfig.openRegistration) {
    return (
      <main className="px-6 py-10">
        <div className="mx-auto max-w-[480px] rounded-xl border border-zinc-300 bg-white p-6 text-center">
          {appConfig.brandLogoUrl ? (
            <div className="mb-4 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={appConfig.brandLogoUrl}
                alt=""
                className="h-12 max-w-[200px] object-contain"
              />
            </div>
          ) : null}
          <h1 className="text-xl font-semibold">
            {appConfig.appName ? `${appConfig.appName}   ` : null}
            Registration unavailable
          </h1>
          <p className="mt-2 text-zinc-600">New accounts are currently disabled by the administrator.</p>
          <p className="mt-4 flex flex-wrap justify-center gap-3 text-sm">
            {appConfig.openLogin ? (
              <Link href="/login" className="text-zinc-900 underline">
                Login
              </Link>
            ) : null}
            <Link href="/" className="text-zinc-900 underline">
              Home
            </Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="px-6 py-10">
      <RegisterForm appName={appConfig.appName} brandLogoUrl={appConfig.brandLogoUrl} />
      <p className="mx-auto mt-4 max-w-[480px] text-sm text-zinc-600">
        {appConfig.openLogin ? (
          <>
            Already have an account? <Link href="/login">Login</Link>
          </>
        ) : (
          <span>Sign-in is currently disabled.</span>
        )}
      </p>
    </main>
  );
}
