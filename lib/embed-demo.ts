export function parseDemoSiteUrl(raw: string): { ok: true; url: string } | { ok: false; message: string } {
  const s = raw.trim();
  if (!s) return { ok: false, message: "Enter a URL." };
  try {
    const url = new URL(s.includes("://") ? s : `https://${s}`);
    if (url.protocol === "https:") return { ok: true, url: url.toString() };
    if (url.protocol === "http:") {
      const h = url.hostname;
      if (h === "localhost" || h === "127.0.0.1" || h === "[::1]") return { ok: true, url: url.toString() };
    }
    return { ok: false, message: "Use https://, or http on localhost only." };
  } catch {
    return { ok: false, message: "Invalid URL." };
  }
}

export function buildEmbedDemoUrl(siteUrl: string, token: string, appOrigin: string): string {
  const u = new URL("/embed/demo", appOrigin.replace(/\/$/, ""));
  u.searchParams.set("site", siteUrl);
  u.searchParams.set("token", token);
  return u.toString();
}
