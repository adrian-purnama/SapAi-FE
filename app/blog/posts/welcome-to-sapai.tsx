import { BlogImage } from "@/app/blog/_components/BlogImage";
import { BlogVideo } from "@/app/blog/_components/BlogVideo";
import type { BlogPostMeta } from "@/app/blog/_lib/types";

export const meta: BlogPostMeta = {
  slug: "welcome-to-sapai",
  title: "Welcome to SapAi",
  excerpt: "What we're building: an AI chatbot platform for websites.",
  date: "2026-05-09",
  author: "SapAi team",
  tags: ["product", "announcement"],
};

export default function WelcomeToSapAiContent() {
  return (
    <>

      <BlogImage
        src="https://drive.amfphub.com/api/public/dl/6ebRykuB?inline=true"
        alt="SapAi platform overview diagram"
        caption="SapAi Logo Awsome Logo"
        width={600}
        height={630}
      />
      {" "}
      <p>
        {" "}
        AI is powerful, but there's one problem every developer eventually runs
        into: AI guesses.{" "}
      </p>{" "}
      <p>
        {" "}
        Large language models can write code, summarize documents, and answer
        questions, but they often lack access to your company's knowledge,
        documentation, or business data. The result is unreliable answers,
        hallucinations, and a poor user experience.{" "}
      </p>{" "}
      <p>
        {" "}
        That's why we built <strong>SapAi</strong>.{" "}
      </p>{" "}
      <h2>What is SapAi?</h2>{" "}
      <p>
        {" "}
        SapAi is a developer-friendly AI platform that makes it easy to build
        applications powered by your own knowledge.{" "}
      </p>{" "}
      <p>
        {" "}
        Upload documents, create a knowledge base, call a simple API, and let
        your users chat with information that actually comes from your content
        instead of relying entirely on model memory.{" "}
      </p>{" "}
      <h2>Stop Making AI Guess</h2>{" "}
      <p>
        {" "}
        Traditional AI applications answer based on what the model learned
        during training.{" "}
      </p>{" "}
      <p>
        {" "}
        SapAi uses Retrieval-Augmented Generation (RAG) to retrieve relevant
        information from your documents before generating a response.{" "}
      </p>{" "}
      <p> This means your AI can answer questions using: </p>{" "}
      <ul>
        {" "}
        <li>Internal documentation</li> <li>Knowledge bases</li>{" "}
        <li>Product manuals</li> <li>FAQ collections</li>{" "}
        <li>Support documents</li> <li>Policies and procedures</li>{" "}
      </ul>{" "}
      <p>
        {" "}
        Instead of guessing, your AI responds using information you actually
        provide.{" "}
      </p>{" "}
      <h2>Built for Developers</h2>{" "}
      <p>
        {" "}
        Most AI platforms force developers to stitch together vector databases,
        embedding pipelines, document ingestion systems, and model APIs.{" "}
      </p>{" "}
      <p> SapAi provides everything behind a single API. </p>{" "}
      <ul>
        {" "}
        <li>Document ingestion</li> <li>Vector search</li>{" "}
        <li>RAG pipelines</li> <li>Chat completions</li>{" "}
        <li>Translation APIs</li> <li>Structured JSON generation</li>{" "}
      </ul>{" "}
      <p>
        {" "}
        Spend less time building infrastructure and more time building
        products.{" "}
      </p>{" "}
      <h2>Reliable Structured Output</h2>{" "}
      <p> Many AI applications need more than plain text. </p>{" "}
      <p>
        {" "}
        SapAi supports structured JSON responses, making it easier to integrate
        AI into existing systems and workflows.{" "}
      </p>{" "}
      <pre>
        {" "}
        {`{ "customer_name": "John Doe", "sentiment": "positive", "priority": "high", "summary": "Customer requested a refund." }`}{" "}
      </pre>{" "}
      <p>
        {" "}
        Perfect for automation, workflow engines, integrations, and backend
        applications.{" "}
      </p>{" "}
      <h2>Translation APIs</h2>{" "}
      <p> Need to translate content between languages? </p>{" "}
      <p>
        {" "}
        SapAi provides translation capabilities through the same platform,
        allowing developers to build multilingual applications without managing
        separate services.{" "}
      </p>{" "}
      <ul>
        {" "}
        <li>Document translation</li> <li>Content localization</li>{" "}
        <li>Multilingual support bots</li>{" "}
        <li>Cross-language search experiences</li>{" "}
      </ul>{" "}
      <h2>Simple Integration</h2>{" "}
      <p> Getting started should take minutes, not weeks. </p>{" "}
      <ol>
        {" "}
        <li>Create a project.</li> <li>Upload your documents.</li>{" "}
        <li>Generate an API key.</li> <li>Start building.</li>{" "}
      </ol>{" "}
      <p>
        {" "}
        Whether you're building a chatbot, internal assistant, support system,
        search experience, or AI-powered workflow, SapAi gives you the building
        blocks you need without the complexity.{" "}
      </p>{" "}
      <h2>What's Next?</h2> <p> This blog will cover: </p>{" "}
      <ul>
        {" "}
        <li>RAG best practices</li> <li>Reducing AI hallucinations</li>{" "}
        <li>Building production AI systems</li>{" "}
        <li>Document processing techniques</li> <li>Structured AI outputs</li>{" "}
        <li>Translation workflows</li>{" "}
        <li>Developer tutorials and examples</li>{" "}
      </ul>{" "}
      <p>
        {" "}
        We're excited to help developers build AI applications that are
        reliable, affordable, and easy to integrate.{" "}
      </p>{" "}
      <p> Welcome to SapAi. </p>{" "}
    </>
  );
}
