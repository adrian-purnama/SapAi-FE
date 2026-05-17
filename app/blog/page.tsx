import type { Metadata } from "next";
import Link from "next/link";

import { buildPageMetadata } from "@/lib/site-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "Blog",
    description: "Product updates, guides, and notes from the SapAi team.",
    path: "/blog",
  });
}

type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
};

const POSTS: BlogPost[] = [
  {
    slug: "welcome-to-sapai",
    title: "Welcome to SapAi",
    excerpt: "What we’re building: an AI chatbot platform for websites.",
    date: "2026-05-09",
  },
];

export default function BlogPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">Blog</h1>
        <p className="mt-3 text-lg text-zinc-600">
          Updates, guides, and product notes. (Mock content for now.)
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-2xl gap-4">
        {POSTS.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-zinc-300 hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-zinc-900">{post.title}</h2>
              <span className="shrink-0 text-xs text-zinc-500">{post.date}</span>
            </div>
            <p className="mt-2 text-sm text-zinc-600">{post.excerpt}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}

