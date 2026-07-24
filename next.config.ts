import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output a self-contained server.js for Docker production
  output: "standalone",

  reactStrictMode: false,
};

export default nextConfig;
