import type { Metadata } from "next";

import {
  getPublicAppConfigForMetadata,
  type AppPublicConfig,
} from "@/lib/app-config-public";
import { APP_APPLE_ICON_PATH, APP_ICON_PATH, getBrandIconSourceUrl } from "@/lib/brand-icon";

export function getSiteMetadataBase(): URL | undefined {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    process.env.VERCEL_URL?.trim();
  if (!raw) return undefined;
  try {
    const url = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
    return new URL(url);
  } catch {
    return undefined;
  }
}

export function getSiteOrigin(): string {
  return getSiteMetadataBase()?.origin ?? "http://localhost:3000";
}

function getOpenGraphImageUrl(
  config: Pick<AppPublicConfig, "brandLogoFileId" | "brandLogoUrl">,
  metadataBase: URL | undefined,
): string {
  const source = getBrandIconSourceUrl(config);
  if (source) return source;
  return metadataBase ? new URL(APP_ICON_PATH, metadataBase).toString() : APP_ICON_PATH;
}

function defaultSiteDescription(appName: string): string {
  return `${appName}   AI chatbot platform with dashboard, docs, and API access.`;
}

export async function buildRootSiteMetadata(): Promise<Metadata> {
  const config = await getPublicAppConfigForMetadata();
  const metadataBase = getSiteMetadataBase();
  const description = defaultSiteDescription(config.appName);
  const socialImage = getOpenGraphImageUrl(config, metadataBase);

  return {
    metadataBase,
    title: {
      default: config.appName,
      template: `%s   ${config.appName}`,
    },
    description,
    applicationName: config.appName,
    robots: {
      index: true,
      follow: true,
    },
    icons: {
      icon: APP_ICON_PATH,
      shortcut: APP_ICON_PATH,
      apple: APP_APPLE_ICON_PATH,
    },
    openGraph: {
      type: "website",
      siteName: config.appName,
      title: config.appName,
      description,
      images: [{ url: socialImage }],
    },
    twitter: {
      card: "summary_large_image",
      title: config.appName,
      description,
      images: [socialImage],
    },
  };
}

type PageMetadataOptions = {
  title: string;
  description: string;
  path?: string;
  noIndex?: boolean;
  openGraphType?: "website" | "article";
  openGraphImages?: Array<{ url: string; alt?: string }>;
};

export async function buildPageMetadata(options: PageMetadataOptions): Promise<Metadata> {
  const config = await getPublicAppConfigForMetadata();
  const metadataBase = getSiteMetadataBase();
  const socialImage = getOpenGraphImageUrl(config, metadataBase);
  const ogImages =
    options.openGraphImages?.length && options.openGraphImages.length > 0
      ? options.openGraphImages
      : [{ url: socialImage }];
  const twitterImages = ogImages.map((img) => img.url);
  const canonicalPath = options.path?.startsWith("/") ? options.path : options.path ? `/${options.path}` : undefined;
  const canonical = canonicalPath && metadataBase ? new URL(canonicalPath, metadataBase).toString() : undefined;

  return {
    title: options.title,
    description: options.description,
    alternates: canonical ? { canonical } : undefined,
    robots: options.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      type: options.openGraphType ?? "website",
      siteName: config.appName,
      title: options.title,
      description: options.description,
      url: canonical,
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: options.title,
      description: options.description,
      images: twitterImages,
    },
  };
}
