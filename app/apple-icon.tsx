import { ImageResponse } from "next/og";

import { getPublicAppConfigForMetadata } from "@/lib/app-config-public";
import { fetchBrandIconResponse } from "@/lib/brand-icon";

export const dynamic = "force-dynamic";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const upstream = await fetchBrandIconResponse();
  if (upstream.ok) {
    return upstream;
  }

  const config = await getPublicAppConfigForMetadata();
  const letter = (config.appName.trim()[0] ?? "S").toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#18181b",
          color: "#fafafa",
          fontSize: 96,
          fontWeight: 700,
        }}
      >
        {letter}
      </div>
    ),
    size,
  );
}
