import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  serverExternalPackages: ["sharp", "@napi-rs/canvas"],
};

export default nextConfig;
