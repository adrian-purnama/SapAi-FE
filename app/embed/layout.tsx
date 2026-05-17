/**
 * Embed routes fill the viewport so iframes get a single chat surface with no extra page chrome.
 */
export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return <div className="h-dvh min-h-0 w-full overflow-hidden bg-zinc-50">{children}</div>;
}
