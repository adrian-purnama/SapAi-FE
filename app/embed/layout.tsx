/**
 * Embed routes fill the viewport so iframes get a single chat surface with no extra page chrome.
 */
export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-dvh min-h-0 w-full overflow-hidden bg-linear-to-br from-zinc-100 via-zinc-50 to-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 18% 8%, color-mix(in srgb, #0ea5e9 14%, transparent) 0%, transparent 42%), radial-gradient(circle at 88% 92%, color-mix(in srgb, #8b5cf6 12%, transparent) 0%, transparent 38%)",
        }}
      />
      <div className="relative h-full min-h-0 w-full">{children}</div>
    </div>
  );
}
