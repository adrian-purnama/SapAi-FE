"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useSapAi } from "@/app/providers/sapai-provider";
import { toastError } from "@/lib/app-toast";
import LoginForm from "./LoginForm";

export default function LoginPageContent() {
  const { appConfig, appConfigLoading, appConfigError } = useSapAi();

  useEffect(() => {
    if (!appConfigLoading && !appConfig && appConfigError) {
      toastError(appConfigError, { id: "app-config-auth" });
    }
  }, [appConfigLoading, appConfig, appConfigError]);

  if (appConfigLoading && !appConfig) {
    return (
      <main className="px-6 py-10">
        <p className="mx-auto max-w-[420px] text-center text-zinc-600">Loading…</p>
      </main>
    );
  }

  if (appConfigError && !appConfig) {
    return (
      <main className="px-6 py-10">
        <p className="mx-auto max-w-[420px] text-center text-sm text-zinc-600">
          Could not load sign-in configuration.
        </p>
      </main>
    );
  }

  if (!appConfig) {
    return (
      <main className="px-6 py-10">
        <p className="mx-auto max-w-[420px] text-center text-zinc-600">Loading…</p>
      </main>
    );
  }

  if (!appConfig.openLogin) {
    return (
      <main className="px-6 py-10">
        <div className="mx-auto max-w-[420px] rounded-xl border border-zinc-300 bg-white p-6 text-center">
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
            Login unavailable
          </h1>
          <p className="mt-2 text-zinc-600">Sign-in is currently disabled by the administrator.</p>
          <p className="mt-4">
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
      <LoginForm appName={appConfig.appName} brandLogoUrl={appConfig.brandLogoUrl} />
      <p className="mx-auto mt-4 max-w-[420px] text-sm text-zinc-600">
        {appConfig.openRegistration ? (
          <>
            No account yet? <Link href="/register">Register</Link>
          </>
        ) : (
          <span>New registrations are currently closed.</span>
        )}
      </p>
    </main>
  );
}
