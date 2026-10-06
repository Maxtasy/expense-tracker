import type { MetadataRoute } from "next";
import { getLocale, getTranslations } from "next-intl/server";

// Fetched by the browser without the user's cookies in most cases, so this is usually the default
// locale; it follows the resolved locale where the request does carry one.
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const t = await getTranslations("meta");
  const locale = await getLocale();
  return {
    // Stable identifier so browsers still recognize this as "the same app" if start_url
    // ever changes (e.g. moves off /dashboard). Without this, start_url doubles as the id.
    id: "/dashboard",
    name: "Expense Tracker",
    short_name: t("shortName"),
    description: t("description"),
    start_url: "/dashboard",
    scope: "/",
    lang: locale,
    dir: "ltr",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait",
    categories: ["finance", "productivity"],
    // No separate native app exists (this *is* the app, wrapped in a TWA) — never suggest one instead.
    prefer_related_applications: false,
    background_color: "#07080b",
    theme_color: "#07080b",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    // Captured from a seeded demo account, not real user data.
    screenshots: [
      {
        src: "/screenshots/dashboard.png",
        sizes: "780x1688",
        type: "image/png",
        form_factor: "narrow",
        label: t("screenshots.dashboard"),
      },
      {
        src: "/screenshots/insights.png",
        sizes: "780x1688",
        type: "image/png",
        form_factor: "narrow",
        label: t("screenshots.insights"),
      },
      {
        src: "/screenshots/categories.png",
        sizes: "780x1688",
        type: "image/png",
        form_factor: "narrow",
        label: t("screenshots.categories"),
      },
      {
        src: "/screenshots/recurring.png",
        sizes: "780x1688",
        type: "image/png",
        form_factor: "narrow",
        label: t("screenshots.recurring"),
      },
      {
        src: "/screenshots/settings.png",
        sizes: "780x1688",
        type: "image/png",
        form_factor: "narrow",
        label: t("screenshots.settings"),
      },
    ],
  };
}
