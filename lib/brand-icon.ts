import type { AppPublicConfig } from "@/lib/app-config-public";
import { getPublicAppConfigForMetadata } from "@/lib/app-config-public";
import { joinServerApiPath } from "@/lib/server-api";

export const APP_ICON_PATH = "/icon";
export const APP_APPLE_ICON_PATH = "/apple-icon";

export function withBrandIconCacheBust(url: string, brandLogoFileId: string | null): string {
  const version = encodeURIComponent(brandLogoFileId ?? "1");
  return `${url}${url.includes("?") ? "&" : "?"}v=${version}`;
}

export function getBrandIconSourceUrl(
  config: Pick<AppPublicConfig, "brandLogoFileId" | "brandLogoUrl">,
): string | null {
  const direct =
    typeof config.brandLogoUrl === "string" && config.brandLogoUrl.trim() !== ""
      ? config.brandLogoUrl.trim()
      : null;
  if (direct) return withBrandIconCacheBust(direct, config.brandLogoFileId);
  if (config.brandLogoFileId) {
    return withBrandIconCacheBust(
      joinServerApiPath(`/api/v1/files/${config.brandLogoFileId}`),
      config.brandLogoFileId,
    );
  }
  return null;
}

export async function fetchBrandIconResponse(): Promise<Response> {
  const config = await getPublicAppConfigForMetadata();
  const sourceUrl = getBrandIconSourceUrl(config);
  if (!sourceUrl) {
    return new Response(null, { status: 404 });
  }

  const upstream = await fetch(sourceUrl, { cache: "no-store" });
  if (!upstream.ok) {
    return new Response(null, { status: upstream.status });
  }

  const contentType = upstream.headers.get("content-type") ?? "image/png";
  const body = await upstream.arrayBuffer();
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=60",
    },
  });
}
