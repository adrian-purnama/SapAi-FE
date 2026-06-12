import type { BlogPostMeta, BlogPostModule } from "@/app/blog/_lib/types";

import WelcomeToSapAiContent, { meta as welcomeMeta } from "./welcome-to-sapai";
import TestContent, { meta as testMeta } from "./test";

/** Add new posts here — one import + one entry in ALL_POST_MODULES. */
const ALL_POST_MODULES: BlogPostModule[] = [
  { meta: welcomeMeta, Content: WelcomeToSapAiContent },

  //add post here
  // { meta: testMeta, Content: TestContent },
];
 
function sortByDateDesc(posts: BlogPostModule[]): BlogPostModule[] {
  return [...posts].sort((a, b) => b.meta.date.localeCompare(a.meta.date));
}

export const BLOG_POSTS = sortByDateDesc(ALL_POST_MODULES);

export function getAllPosts(): BlogPostMeta[] {
  return BLOG_POSTS.map((p) => p.meta);
}

export function getPostBySlug(slug: string): BlogPostModule | undefined {
  return BLOG_POSTS.find((p) => p.meta.slug === slug);
}

export function getAllPostSlugs(): string[] {
  return BLOG_POSTS.map((p) => p.meta.slug);
}
