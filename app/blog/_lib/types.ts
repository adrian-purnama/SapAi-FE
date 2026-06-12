import type { JSX } from "react";

export type BlogPostMeta = {
  slug: string;
  title: string;
  excerpt: string;
  /** ISO date YYYY-MM-DD */
  date: string;
  coverImage?: { src: string; alt: string };
  author?: string;
  tags?: string[];
};

export type BlogPostModule = {
  meta: BlogPostMeta;
  Content: () => JSX.Element;
};
