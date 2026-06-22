import { BlogImage } from "@/app/blog/_components/BlogImage";
import { BlogVideo } from "@/app/blog/_components/BlogVideo";
import type { BlogPostMeta } from "@/app/blog/_lib/types";

export const meta: BlogPostMeta = {
  slug: "test",
  title: "Test",
  excerpt: "Test",
  date: "2026-05-09",
  author: "SapAi team",
  tags: ["product", "announcement"],
};

export default function WelcomeToSapAiContent() {
  return (
    <>
      <p>
        SapAi is an AI-powered chatbot platform for websites. You upload knowledge, get an API key, and
        answer visitors from your own content   or embed a branded chat widget on any site.
      </p>

      <h2>What you can do today</h2>
      <ul>
        <li>Chat and RAG jobs via the standalone API</li>
        <li>FAQ knowledge upload and vector search in the dashboard</li>
        <li>Public embed widget on Pro and Scale plans</li>
      </ul>

      <BlogImage
        src="/blog/welcome-to-sapai/hero.svg"
        alt="SapAi platform overview diagram"
        caption="Drop images into public/blog/your-slug/ and reference them with BlogImage."
        width={1200}
        height={630}
      />

      <h2>See it in action</h2>
      <p>
        Self-hosted video files work too   place an mp4 under{" "}
        <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-sm">public/blog/&lt;slug&gt;/</code>{" "}
        and use <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-sm">BlogVideo</code>. YouTube
        embeds use <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-sm">type=&quot;youtube&quot;</code>{" "}
        with an embed id.
      </p>

      <BlogVideo
        type="youtube"
        embedId="dQw4w9WgXcQ"
        title="Example YouTube embed in a blog post"
      />
    </>
  );
}
