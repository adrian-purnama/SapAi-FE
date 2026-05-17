import Link from "next/link";
import AdminUserDetailsPanel from "@/app/forms/adminUsers/AdminUserDetailsPanel";

export default async function AdminUserDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <Link href="/admin/users" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
        ← Users
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-zinc-900">User details</h1>
      <p className="mt-2 text-sm text-zinc-600">Edit plan, tokens, blocks, and password actions.</p>
      <AdminUserDetailsPanel userId={id} />
    </main>
  );
}

