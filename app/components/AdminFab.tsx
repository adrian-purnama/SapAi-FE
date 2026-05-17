"use client";

import Link from "next/link";
import { useSapAi } from "@/app/providers/sapai-provider";

export default function AdminFab() {
  const { user } = useSapAi();

  if (!user?.isAdmin) return null;

  return (
    <Link
      href="/admin"
      className="fixed bottom-6 right-6 z-50 rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg ring-1 ring-zinc-950/10 transition hover:bg-zinc-800"
    >
      Admin
    </Link>
  );
}
