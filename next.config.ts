import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The floating dev-mode badge would otherwise show up in every screenshot taken against `next dev`.
  devIndicators: false,
};

export default nextConfig;
