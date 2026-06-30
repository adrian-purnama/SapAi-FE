import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getServerApiBaseUrl } from "@/lib/server-api";

const EMBED_PREFIX = "/embed/t/";

function extractEmbedTokenFromPath(pathname: string): string | null {
  if (!pathname.startsWith(EMBED_PREFIX)) return null;
  const rest = pathname.slice(EMBED_PREFIX.length);
  const segment = rest.split("/")[0];
  if (!segment) return null;
  try {
    return decodeURIComponent(segment);
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (!pathname.startsWith(EMBED_PREFIX)) {
    return NextResponse.next();
  }

  const token = extractEmbedTokenFromPath(pathname);
  let csp = "frame-ancestors 'none'";
  if (token) {
    const base = getServerApiBaseUrl();
    try {
      const res = await fetch(`${base}/api/v1/embed/frame-policy?token=${encodeURIComponent(token)}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const j = (await res.json()) as {
          success?: boolean;
          data?: { frameAncestors?: unknown };
        };
        const raw = j.success === true ? j.data?.frameAncestors : undefined;
        if (Array.isArray(raw) && raw.length > 0) {
          const parts = raw.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
          if (parts.length > 0) {
            csp = `frame-ancestors ${parts.join(" ")}`;
          }
        }
      }
    } catch {
      /* fail closed: 'none' */
    }
  }

  const response = NextResponse.next();
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: "/embed/t/:path*",
};
