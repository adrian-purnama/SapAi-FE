import Link from "next/link";
import AdminAppSettingsForm from "@/app/forms/adminAppSettings/AdminAppSettingsForm";

export default function AdminAppSettingsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/admin" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
        ← Admin
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-zinc-900">App settings</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Update how the app appears on auth pages and whether login / registration are allowed.
      </p>
      <div className="mt-8">
        <AdminAppSettingsForm />
      </div>
    </main>
  );
}

