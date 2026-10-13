import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // The floating dev-mode badge would otherwise show up in every screenshot taken against `next dev`.
  devIndicators: false,
  // Lets a phone on the same Wi-Fi use `next dev` (e.g. DEV_ORIGINS=192.168.1.20 in .env.local):
  // without it Next blocks the dev JS from a non-localhost origin, so the page never hydrates.
  allowedDevOrigins: process.env.DEV_ORIGINS?.split(",").map((o) => o.trim()).filter(Boolean),
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
