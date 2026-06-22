import Link from "next/link";
import AdminChatJobDetailPanel from "@/app/forms/adminChatJobs/AdminChatJobDetailPanel";

export default async function AdminChatJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <Link href="/admin/chat-jobs" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
        ← Chat jobs
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-zinc-900">Job details</h1>
      <p className="mt-2 text-sm text-zinc-600">Full chat job document (admin only).</p>
      <AdminChatJobDetailPanel jobId={id} />
    </main>
  );
}
