import type { MetadataRoute } from "next";

import { getPublicAppConfigForMetadata } from "@/lib/app-config-public";
import { APP_ICON_PATH } from "@/lib/brand-icon";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const config = await getPublicAppConfigForMetadata();
  const icon = APP_ICON_PATH;

  return {
    name: config.appName,
    short_name: config.appName,
    description: `${config.appName} — AI chatbot platform with dashboard, docs, and API access.`,
    start_url: "/",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#18181b",
    icons: [
      {
        src: icon,
        sizes: "any",
        type: "image/png",
      },
    ],
  };
}
