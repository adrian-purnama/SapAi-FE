import type { CSSProperties } from "react";

/** Default iframe widget size (matches EmbedRagChat compact panel). */
export const EMBED_IFRAME_W = 312;
export const EMBED_IFRAME_H = 428;

export const EMBED_IFRAME_INLINE_STYLE: CSSProperties = {
  position: "fixed",
  bottom: 20,
  right: 20,
  border: 0,
  borderRadius: 16,
  background: "transparent",
  zIndex: 2147483000,
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
};
