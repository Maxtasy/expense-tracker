import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    // Stable identifier so browsers still recognize this as "the same app" if start_url
    // ever changes (e.g. moves off /dashboard). Without this, start_url doubles as the id.
    id: "/dashboard",
    name: "Expense Tracker",
    short_name: "Expenses",
    description: "Track and categorize your personal income and expenses",
    start_url: "/dashboard",
    scope: "/",
    lang: "en",
    dir: "ltr",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait",
    categories: ["finance", "productivity"],
    // No separate native app exists (this *is* the app, wrapped in a TWA) — never suggest one instead.
    prefer_related_applications: false,
    background_color: "#0b0e14",
    theme_color: "#0b0e14",
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
        label: "Monthly overview with income, expenses, and transactions",
      },
      {
        src: "/screenshots/insights.png",
        sizes: "780x1688",
        type: "image/png",
        form_factor: "narrow",
        label: "Income and expense breakdown by category",
      },
      {
        src: "/screenshots/categories.png",
        sizes: "780x1688",
        type: "image/png",
        form_factor: "narrow",
        label: "Manage expense and income categories",
      },
      {
        src: "/screenshots/recurring.png",
        sizes: "780x1688",
        type: "image/png",
        form_factor: "narrow",
        label: "Set up recurring income and expenses",
      },
      {
        src: "/screenshots/settings.png",
        sizes: "780x1688",
        type: "image/png",
        form_factor: "narrow",
        label: "Export and import your data as CSV",
      },
    ],
  };
}
