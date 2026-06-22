import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_RECAPTCHA_SITE_KEY:
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim() ||
      process.env.RECAPTCHA_SITE_KEY?.trim() ||
      "",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "drive.amfphub.com",
        pathname: "/api/public/**",
      },
    ],
  },
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
