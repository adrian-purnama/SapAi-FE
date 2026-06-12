import Link from "next/link";

export default function BlogPostNotFound() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold text-zinc-900">Post not found</h1>
      <p className="mt-2 text-zinc-600">This blog post does not exist.</p>
      <Link href="/blog" className="mt-6 inline-block text-sm font-medium text-zinc-700 hover:text-zinc-900">
        Back to blog
      </Link>
    </div>
  );
}
