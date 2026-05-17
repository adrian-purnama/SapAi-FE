export function getServerApiBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SERVER_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_STANDALONE_API_URL?.trim() ||
    "http://localhost:8000";
  return raw.replace(/\/$/, "");
}

export function joinServerApiPath(pathname: string): string {
  const base = getServerApiBaseUrl();
  const p = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${base}${p}`;
}

