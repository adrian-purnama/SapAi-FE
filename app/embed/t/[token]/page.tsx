import type { Metadata } from "next";

import { EmbedTokenGate } from "./EmbedTokenGate";

type PageProps = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  await params;
  return {
    title: "Assistant",
    description: "Embedded RAG assistant.",
    robots: { index: false, follow: false },
  };
}

export default async function EmbedTokenPage({ params }: PageProps) {
  const { token } = await params;
  return <EmbedTokenGate token={token} />;
}
