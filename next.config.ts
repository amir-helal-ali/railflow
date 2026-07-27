import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output a self-contained server.js for Docker production
  output: "standalone",

  reactStrictMode: false,

  // Rewrites: proxy /api/* to the Rust backend in development
  // In production, Caddy handles this routing
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8080";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: "/ws/:path*",
        destination: `${backendUrl}/ws/:path*`,
      },
    ];
  },
};

export default nextConfig;
