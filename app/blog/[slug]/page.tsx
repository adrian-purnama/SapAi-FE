import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BlogPostLayout } from "@/app/blog/_components/BlogPostLayout";
import { getAllPostSlugs, getPostBySlug } from "@/app/blog/posts";
import { buildPageMetadata, getSiteOrigin } from "@/lib/site-metadata";

export function generateStaticParams() {
  return getAllPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return buildPageMetadata({
      title: "Post not found",
      description: "This blog post does not exist.",
      path: `/blog/${slug}`,
      noIndex: true,
    });
  }

  const origin = getSiteOrigin();
  const ogImage = post.meta.coverImage?.src
    ? post.meta.coverImage.src.startsWith("http")
      ? post.meta.coverImage.src
      : `${origin}${post.meta.coverImage.src}`
    : undefined;

  return buildPageMetadata({
    title: post.meta.title,
    description: post.meta.excerpt,
    path: `/blog/${slug}`,
    openGraphType: "article",
    openGraphImages: ogImage ? [{ url: ogImage, alt: post.meta.coverImage?.alt ?? post.meta.title }] : undefined,
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const { meta, Content } = post;

  return (
    <div className="mx-auto max-w-3xl">
      <BlogPostLayout meta={meta}>
        <Content />
      </BlogPostLayout>
    </div>
  );
}
