"use client";

import { useSapAi } from "@/app/providers/sapai-provider";
import ForgotPasswordForm from "./ForgotPasswordForm";

export default function ForgotPasswordPageContent() {
  const { appConfig, appConfigLoading } = useSapAi();

  if (appConfigLoading && !appConfig) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12">
        <p className="text-zinc-600">Loading…</p>
      </main>
    );
  }

  if (!appConfig?.openLogin) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12">
        <div className="mx-auto max-w-[480px] rounded-xl border border-zinc-300 bg-white p-6 text-center">
          {appConfig?.brandLogoUrl ? (
            <div className="mb-4 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={appConfig.brandLogoUrl}
                alt=""
                className="h-12 max-w-[200px] object-contain"
              />
            </div>
          ) : null}
          <h1 className="text-xl font-semibold">Password reset is currently closed</h1>
          <p className="mt-2 text-zinc-600">Login is disabled by configuration.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <ForgotPasswordForm
        appName={appConfig.appName}
        brandLogoUrl={appConfig.brandLogoUrl}
      />
    </main>
  );
}

