import type { Metadata } from "next";
import Link from "next/link";

import { buildPageMetadata } from "@/lib/site-metadata";

type Post = {
  title: string;
  date: string;
  body: string[];
};

const POSTS: Record<string, Post> = {
  "welcome-to-sapai": {
    title: "Welcome to SapAi",
    date: "2026-05-09",
    body: [
      "SapAi is an AI-powered chatbot platform for websites.",
    ],
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = POSTS[slug];
  if (!post) {
    return buildPageMetadata({
      title: "Post not found",
      description: "This blog post does not exist.",
      path: `/blog/${slug}`,
      noIndex: true,
    });
  }

  return buildPageMetadata({
    title: post.title,
    description: post.body[0] ?? post.title,
    path: `/blog/${slug}`,
    openGraphType: "article",
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = POSTS[slug];

  if (!post) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-semibold text-zinc-900">Post not found</h1>
        <p className="mt-2 text-zinc-600">This blog post does not exist.</p>
        <Link href="/blog" className="mt-6 inline-block text-sm text-zinc-700 hover:text-zinc-900">
          Back to blog
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <Link href="/blog" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
        ← Blog
      </Link>

      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-900">{post.title}</h1>
      <p className="mt-2 text-sm text-zinc-500">{post.date}</p>

      <article className="mt-8 space-y-4 text-zinc-700">
        {post.body.map((p) => (
          <p key={p} className="leading-relaxed">
            {p}
          </p>
        ))}
      </article>
    </main>
  );
}

