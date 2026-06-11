import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { buildRootSiteMetadata } from "@/lib/site-metadata";
import { AppChrome } from "@/app/components/AppChrome";
import { AppToaster } from "@/app/components/AppToaster";
import { SapAiSiteEmbed } from "@/app/components/SapAiSiteEmbed";
import { SapAiProvider } from "@/app/providers/sapai-provider";
import "./globals.css";

// NEXT_PUBLIC_SITE_EMBED_DEFAULT_OPEN=false — widget starts closed (FAB only); iframe stays mounted when hidden.
const SITE_EMBED_IFRAME_SRC =
  process.env.NEXT_PUBLIC_SITE_EMBED_IFRAME_SRC?.trim() ||
  "http://localhost:3000/embed/t/et_64546b4a0e4a03918a354a72b90076bf21d5bcf0b7dc7122";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  return buildRootSiteMetadata();
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-zinc-50 text-zinc-900 antialiased">
        <SapAiProvider>
          <AppChrome />
          <AppToaster />
          {children}
        </SapAiProvider>
        <SapAiSiteEmbed src={SITE_EMBED_IFRAME_SRC} />
      </body>
    </html>
  );
}
