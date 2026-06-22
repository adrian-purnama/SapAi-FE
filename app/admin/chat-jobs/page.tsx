import Link from "next/link";
import AdminChatJobsPanel from "@/app/forms/adminChatJobs/AdminChatJobsPanel";

export default function AdminChatJobsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <Link href="/admin" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
        ← Admin
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900">Chat jobs</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-600">
        Browse all chat, RAG, and translate jobs. Filter by user, task type, status, or plan.
      </p>
      <AdminChatJobsPanel />
    </main>
  );
}
