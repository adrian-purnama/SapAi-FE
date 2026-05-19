import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_RECAPTCHA_SITE_KEY:
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim() ||
      process.env.RECAPTCHA_SITE_KEY?.trim() ||
      "",
  },
  /**
   * pdfjs (used by `pdf-parse`) must resolve `pdf.worker.mjs` from `node_modules`.
   * Bundling it into `.next` breaks worker paths under Turbopack.
   */
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
  async redirects() {
    return [
      {
        source: "/favicon.ico",
        destination: "/icon",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
