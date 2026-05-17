import Link from "next/link";

import AdminPlansPanel from "@/app/forms/adminPlans/AdminPlansPanel";

export default function AdminPlansPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <Link href="/admin" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
        ← Admin
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-zinc-900">Plans</h1>
      <AdminPlansPanel />
    </main>
  );
}
