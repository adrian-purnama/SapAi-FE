import type { Metadata } from "next";

import { ChatJobsDocsContent } from "./ChatJobsDocsContent";

export const metadata: Metadata = {
  title: "Standalone API   Chat jobs   SapAi",
  description: "Send chat, RAG, and translate jobs; poll and stream results with a shared job id.",
};

export default function ServerChatDocsPage() {
  return <ChatJobsDocsContent />;
}
