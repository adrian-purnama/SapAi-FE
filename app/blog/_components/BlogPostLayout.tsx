import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { BlogProse } from "@/app/blog/_components/BlogProse";
import type { BlogPostMeta } from "@/app/blog/_lib/types";

type Props = {
  meta: BlogPostMeta;
  children: ReactNode;
};

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function BlogPostLayout({ meta, children }: Props) {
  return (
    <article>
      <Link href="/blog" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
        ← Blog
      </Link>

      <header className="mt-4">
        {meta.tags?.length ? (
          <div className="flex flex-wrap gap-2">
            {meta.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs font-medium text-zinc-600"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-900">{meta.title}</h1>

        <p className="mt-3 text-sm text-zinc-500">
          <time dateTime={meta.date}>{formatDate(meta.date)}</time>
          {meta.author ? <span> · {meta.author}</span> : null}
        </p>

        {meta.coverImage ? (
          <div className="mt-8 overflow-hidden rounded-xl border border-zinc-200 shadow-sm">
            <Image
              src={meta.coverImage.src}
              alt={meta.coverImage.alt}
              width={1200}
              height={630}
              priority
              sizes="(max-width: 768px) 100vw, 720px"
              className="h-auto w-full object-cover"
            />
          </div>
        ) : null}
      </header>

      <BlogProse className="mt-8">{children}</BlogProse>
    </article>
  );
}
