import Image from "next/image";
import Link from "next/link";

import type { BlogPostMeta } from "@/app/blog/_lib/types";

type Props = {
  post: BlogPostMeta;
};

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function BlogPostCard({ post }: Props) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:border-zinc-300 hover:shadow-md"
    >
      {post.coverImage ? (
        <div className="relative aspect-[2/1] overflow-hidden border-b border-zinc-100 bg-zinc-50">
          <Image
            src={post.coverImage.src}
            alt={post.coverImage.alt}
            fill
            sizes="(max-width: 768px) 100vw, 640px"
            className="object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        </div>
      ) : null}

      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold text-zinc-900 group-hover:text-zinc-700">{post.title}</h2>
          <time dateTime={post.date} className="shrink-0 text-xs text-zinc-500">
            {formatDate(post.date)}
          </time>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">{post.excerpt}</p>
        {post.tags?.length ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
