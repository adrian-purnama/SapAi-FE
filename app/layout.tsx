import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { buildRootSiteMetadata } from "@/lib/site-metadata";
import { AppChrome } from "@/app/components/AppChrome";
import { AppToaster } from "@/app/components/AppToaster";
import { SapAiProvider } from "@/app/providers/sapai-provider";
import "./globals.css";

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
      </body>
    </html>
  );
}
