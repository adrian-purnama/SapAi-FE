import Link from "next/link";
import { Layers, Settings, Users } from "lucide-react";

export default function AdminPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-2xl font-semibold text-zinc-900">Admin</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Manage application settings, subscription plans, and users.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/app-settings"
          className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md"
        >
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-700">
              <Settings className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-zinc-900">App settings</h2>
              <p className="mt-1 text-sm text-zinc-600">
                Branding, login/registration gates, and configuration.
              </p>
              <p className="mt-4 text-sm font-semibold text-zinc-900 transition group-hover:text-zinc-800">
                Open →
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/plans"
          className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md"
        >
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-700">
              <Layers className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-zinc-900">Plans</h2>
              <p className="mt-1 text-sm text-zinc-600">
                Limits, priority, retention, and embed flags (in-memory on server).
              </p>
              <p className="mt-4 text-sm font-semibold text-zinc-900 transition group-hover:text-zinc-800">
                Open →
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/users"
          className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md"
        >
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-700">
              <Users className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-zinc-900">Users</h2>
              <p className="mt-1 text-sm text-zinc-600">
                Tokens, plan, blocks, and password resets.
              </p>
              <p className="mt-4 text-sm font-semibold text-zinc-900 transition group-hover:text-zinc-800">
                Open →
              </p>
            </div>
          </div>
        </Link>
      </div>
    </main>
  );
}
