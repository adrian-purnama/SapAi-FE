import Link from "next/link";
import { Layers } from "lucide-react";

import AdminPlansPanel from "@/app/forms/adminPlans/AdminPlansPanel";

export default function AdminPlansPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
      <Link
        href="/admin"
        className="inline-flex items-center text-sm font-medium text-zinc-600 transition hover:text-zinc-900"
      >
        ← Admin
      </Link>

      <div className="mt-5 flex items-start gap-3">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-sm">
          <Layers className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Plans</h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-zinc-600">
            Subscription limits, priority routing, and embed flags. Changes are stored in MongoDB and
            reloaded into server memory on save.
          </p>
        </div>
      </div>

      <AdminPlansPanel />
    </main>
  );
}
