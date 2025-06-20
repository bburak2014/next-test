// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-eval' 'unsafe-inline' ${process.env.AUTH0_ISSUER_BASE_URL};
              style-src 'self' 'unsafe-inline';
              img-src 'self' data: blob: ${process.env.AUTH0_ISSUER_BASE_URL};
              connect-src 'self' ${process.env.AUTH0_ISSUER_BASE_URL};
              frame-src ${process.env.AUTH0_ISSUER_BASE_URL};
            `
              .replace(/\s{2,}/g, " ")
              .trim(),
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
