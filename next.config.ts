import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  },
  images: {
    // Local images only — logo.png is in /public
    domains: [],
  },
  // Production optimisations
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;
