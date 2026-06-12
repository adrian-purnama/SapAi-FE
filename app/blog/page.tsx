import type { Metadata } from "next";

import { BlogPostCard } from "@/app/blog/_components/BlogPostCard";
import { getAllPosts } from "@/app/blog/posts";
import { buildPageMetadata } from "@/lib/site-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "Blog",
    description: "Product updates, guides, and notes from the SapAi team.",
    path: "/blog",
  });
}

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">Blog</h1>
        <p className="mt-3 text-lg text-zinc-600">Updates, guides, and product notes from the SapAi team.</p>
      </div>

      {posts.length > 0 ? (
        <div className="mx-auto mt-10 grid max-w-2xl gap-4">
          {posts.map((post) => (
            <BlogPostCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <p className="mx-auto mt-10 max-w-2xl text-sm text-zinc-600">No posts yet.</p>
      )}
    </>
  );
}
